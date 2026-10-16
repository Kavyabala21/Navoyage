import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminControls } from './admin-controls';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { of, Observable, throwError } from 'rxjs';

describe('AdminControls', () => {

  let component: AdminControls;
  let fixture: ComponentFixture<AdminControls>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let facadeSpy: jasmine.SpyObj<DataFacade>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj('Api_Calls', [
      'getAllVehicles',
      'getAllTravelCompanies',
      'getAllVehicleDocuments',
      'approveOrRejectDocument'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    facadeSpy = jasmine.createSpyObj('DataFacade', ['dummy']);

    apiSpy.getAllVehicles.and.returnValue(of({ status: true, data: [] }));
    apiSpy.getAllTravelCompanies.and.returnValue(of({ status: true, data: [] }));
    apiSpy.getAllVehicleDocuments.and.returnValue(of({ status: true, data: [] }));
    apiSpy.approveOrRejectDocument.and.returnValue(of({ status: true }));

    await TestBed.configureTestingModule({
      imports: [
        AdminControls,
        HttpClientTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DataFacade, useValue: facadeSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
            paramMap: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminControls);
    component = fixture.componentInstance;

    /* MOCK LEAFLET MAP TO FIX invalidateSize ERROR */
    (component as any).map = {
      invalidateSize: jasmine.createSpy('invalidateSize')
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load vehicles on init', () => {

    apiSpy.getAllVehicles.and.returnValue(of({
      status: true,
      data: [{ vehicleId: 1, vehicleCode: 'BUS01', modeOfTransport: 'Bus' }]
    }));

    component.ngOnInit();

    expect(apiSpy.getAllVehicles).toHaveBeenCalled();
  });

  it('should handle vehicle load failure', () => {

    apiSpy.getAllVehicles.and.returnValue(of({
      status: false,
      data: []
    }));

    component.loadVehicles();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load vehicles');
  });

  it('should load travel companies after vehicles', () => {

    apiSpy.getAllVehicles.and.returnValue(of({
      status: true,
      data: [{ vehicleId: 1, vehicleCode: 'BUS01', modeOfTransport: 'Bus' }]
    }));

    apiSpy.getAllTravelCompanies.and.returnValue(of({
      status: true,
      data: [{ ownerId: 1, companyName: 'ABC Travels' }]
    }));

    component.loadVehicles();

    expect(apiSpy.getAllTravelCompanies).toHaveBeenCalled();
  });

  it('should load pending documents', () => {

    component.vehicleModeMap = { 1: 'Bus' };
    component.modeofTransport = 'Bus';

    apiSpy.getAllVehicleDocuments.and.returnValue(of({
      status: true,
      data: [
        { vehicleId: 1, status: 'Pending' },
        { vehicleId: 1, status: 'Approved' }
      ]
    }));

    component.loadPendingDocuments();

    expect(component.filteredDocuments.length).toBe(1);
  });

  it('should open review panel', () => {

    const doc = { documentId: 5 };

    component.openReview(doc);

    expect(component.selectedDoc).toEqual(doc);
  });

  it('should cancel review', () => {

    component.selectedDoc = { documentId: 1 };

    component.cancelReview();

    expect(component.selectedDoc).toBeNull();
  });

  it('should approve document', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = 'Good';
    component.remarks = 'All good';

    component.submitDecision('Approved');

    expect(apiSpy.approveOrRejectDocument).toHaveBeenCalled();
  });

  it('should reject document', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = 'Bad';
    component.remarks = 'Damaged';

    component.submitDecision('Rejected');

    expect(apiSpy.approveOrRejectDocument).toHaveBeenCalled();
  });

  it('should show warning if fields missing', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = '';
    component.remarks = '';

    component.submitDecision('Approved');

    expect(toastrSpy.warning).toHaveBeenCalledWith('Vehicle condition is required');
  });

  it('should require rejection reason', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = 'Bad';
    component.remarks = '';

    component.submitDecision('Rejected');

    expect(toastrSpy.warning).toHaveBeenCalledWith('Rejection reason is required');
  });

  it('should navigate to dashboard', () => {

    component.backtohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to view documents page', () => {

    component.viewAllDocuments();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['viewalldocuments']);
  });

  it('should handle vehicle load API error', () => {

    apiSpy.getAllVehicles.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.loadVehicles();

    expect(toastrSpy.error).toHaveBeenCalledWith('Error loading vehicles');
  });

  it('should handle travel company load error', () => {

    apiSpy.getAllTravelCompanies.and.returnValue(
      new Observable(observer => {
        observer.error('error');
      })
    );

    component.loadTravelCompanies();

    expect(toastrSpy.error).toHaveBeenCalledWith('Error loading travel companies');
  });

  it('should handle document load failure', () => {

    apiSpy.getAllVehicleDocuments.and.returnValue(of({ status: false }));

    component.loadPendingDocuments();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load documents');
  });

  it('should handle document load error', () => {

    apiSpy.getAllVehicleDocuments.and.callFake(() => {
      return {
        subscribe: ({ error }: any) => error()
      } as any;
    });

    component.loadPendingDocuments();

    expect(toastrSpy.error).toHaveBeenCalledWith('Error loading documents');
  });

  it('should handle approve/reject API failure', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = 'Good';
    component.remarks = 'ok';

    apiSpy.approveOrRejectDocument.and.returnValue(of({
      status: false,
      message: 'failed'
    }));

    component.submitDecision('Approved');

    expect(toastrSpy.error).toHaveBeenCalledWith('failed');
  });

  it('should handle approve/reject API error', () => {

    component.selectedDoc = { documentId: 1 };
    component.vehicleCondition = 'Good';
    component.remarks = 'ok';

    apiSpy.approveOrRejectDocument.and.callFake(() => {
      return {
        subscribe: ({ error }: any) => error()
      } as any;
    });

    component.submitDecision('Approved');

    expect(toastrSpy.error).toHaveBeenCalledWith('Action failed');
  });

  it('should call approve wrapper', () => {

    spyOn(component, 'submitDecision');

    component.approve();

    expect(component.submitDecision).toHaveBeenCalledWith('Approved');
  });

  it('should call reject wrapper', () => {

    spyOn(component, 'submitDecision');

    component.reject();

    expect(component.submitDecision).toHaveBeenCalledWith('Rejected');
  });

  it('should not download when document url missing', () => {

    spyOn(console, 'error');

    component.download({});

    expect(console.error).toHaveBeenCalledWith('File path not found');
  });

  it('should allow approve condition', () => {

    component.vehicleCondition = 'Good';
    component.remarks = 'valid';

    expect(component.canApprove()).toBeTrue();
  });

  it('should allow reject condition', () => {

    component.vehicleCondition = 'Bad';
    component.remarks = 'invalid';

    expect(component.canReject()).toBeTrue();
  });

  it('should not allow approve with invalid condition', () => {

    component.vehicleCondition = 'Bad';
    component.remarks = 'test';

    expect(component.canApprove()).toBeFalse();
  });

  it('should not allow reject with invalid condition', () => {

    component.vehicleCondition = 'Good';
    component.remarks = 'test';

    expect(component.canReject()).toBeFalse();
  });

  it('should download document when url is present', () => {

    const doc = {
      documentUrl: '/files/test.pdf',
      documentName: 'test.pdf'
    };

    const fakeLink = {
      href: '',
      download: '',
      target: '',
      click: jasmine.createSpy('click')
    } as any;

    spyOn(document, 'createElement').and.returnValue(fakeLink);
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.download(doc);

    expect(fakeLink.href).toBe(component.backendUrl + doc.documentUrl);
    expect(fakeLink.download).toBe('test.pdf');
    expect(fakeLink.target).toBe('_blank');

    expect(document.body.appendChild).toHaveBeenCalledWith(fakeLink);
    expect(fakeLink.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(fakeLink);
  });

  it('should use default filename if documentName is missing', () => {

    const doc = {
      documentUrl: '/files/test.pdf'
    };

    const fakeLink: any = { click: jasmine.createSpy('click') };

    spyOn(document, 'createElement').and.returnValue(fakeLink);
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.download(doc);

    expect(fakeLink.download).toBe('document.pdf');
  });

});
