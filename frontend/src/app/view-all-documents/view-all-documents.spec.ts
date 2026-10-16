
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewAllDocuments } from './view-all-documents';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from 'src/Shared/Services/api-calls';

describe('ViewAllDocuments Component', () => {

  let component: ViewAllDocuments;
  let fixture: ComponentFixture<ViewAllDocuments>;
  let routerSpy: jasmine.SpyObj<Router>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', ['getAllVehicleDocuments']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['error', 'warning']);

    apiSpy.getAllVehicleDocuments.and.returnValue(of({
      status: true,
      data: [
        {
          documentId: 1,
          documentName: 'Permit',
          documentUrl: '/Documents/permit.pdf',
          status: 'Pending',
          vehicleId: 10,
          uploadedOn: '2026-07-23T00:00:00',
          vehicle: {
            vehicleCode: 'BUS-100',
            vehicleModel: 'Volvo',
            modeOfTransport: 'Bus',
            travelCompany: { companyName: 'Endava Travels' }
          }
        },
        {
          documentId: 2,
          documentName: 'Insurance',
          documentUrl: '/Documents/insurance.pdf',
          status: 'Approved',
          vehicleId: 11,
          uploadedOn: '2026-07-22T00:00:00',
          vehicle: {
            vehicleCode: 'BUS-101',
            vehicleModel: 'Scania',
            modeOfTransport: 'Bus',
            travelCompany: { companyName: 'Endava Travels' }
          }
        }
      ]
    }));

    await TestBed.configureTestingModule({
      imports: [ViewAllDocuments],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewAllDocuments);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load all vehicle documents', () => {
    expect(apiSpy.getAllVehicleDocuments).toHaveBeenCalled();
    expect(component.documents.length).toBe(2);
  });

  it('should filter documents by status and search text', () => {
    component.statusFilter = 'Pending';
    component.searchText = 'permit';

    expect(component.filteredDocuments.length).toBe(1);
    expect(component.filteredDocuments[0].documentName).toBe('Permit');
  });

  it('should clear filters', () => {
    component.statusFilter = 'Pending';
    component.searchText = 'permit';

    component.clearFilters();

    expect(component.statusFilter).toBe('');
    expect(component.searchText).toBe('');
  });

  it('should show toaster when document loading fails', () => {
    apiSpy.getAllVehicleDocuments.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));

    component.loadDocuments();

    expect(component.documents).toEqual([]);
    expect(toastrSpy.error).toHaveBeenCalledWith('Failed');
  });

  /* ---------------- ROUTER ---------------- */

  it('should inject router', () => {
    expect(routerSpy).toBeTruthy();
  });

  /* ---------------- NAVIGATION ---------------- */

  it('should navigate to admincontrols when backtohome is called', () => {

    component.backtohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admincontrols']);

  });

});

