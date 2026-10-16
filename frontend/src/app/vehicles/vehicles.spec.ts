import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Vehicles } from './vehicles';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('Vehicles Component', () => {

  let component: Vehicles;
  let fixture: ComponentFixture<Vehicles>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const activatedRouteStub = {
    snapshot: {
      queryParams: {}
    }
  };

  beforeEach(async () => {

    sessionStorage.setItem('transportMode', 'Bus');

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getVehicleById',
      'getDocumentsByVehicle',
      'getMyTravelCompany',
      'addVehicle',
      'updateVehicle',
      'uploadVehicleDocument'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    /* Safe default mocks */
    apiSpy.getVehicleById.and.returnValue(of({ data: {} }));
    apiSpy.getDocumentsByVehicle.and.returnValue(of({ data: [] }));
    apiSpy.getMyTravelCompany.and.returnValue(of({ data: { travelCompanyId: 1 } }));
    apiSpy.addVehicle.and.returnValue(of({ data: { vehicleId: 1 } }));
    apiSpy.updateVehicle.and.returnValue(of({}));
    apiSpy.uploadVehicleDocument.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Vehicles);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  /* ================= BASIC ================= */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to add vehicle mode', () => {
    expect(component.isAddVehicle).toBeTrue();
  });

  /* ================= VALIDATION ================= */

  it('should validate vehicle code', () => {

    component.modeOfTransport = 'Bus';
    component.vehicleCode = 'KA01AB1234';

    expect(component.validateVehicleCode()).toBeTrue();
  });

  it('should fail empty vehicle code', () => {

    component.vehicleCode = '';

    expect(component.validateVehicleCode()).toBeFalse();
  });

  it('should validate vehicle model', () => {

    component.vehicleModel = 'Volvo 9400';

    expect(component.validateVehicleModel()).toBeTrue();
  });

  it('should validate capacity', () => {

    component.capacity = 40;

    expect(component.validateCapacity()).toBeTrue();
  });

  it('should validate description', () => {

    component.description = 'Luxury bus';

    expect(component.validateDescription()).toBeTrue();
  });

  /* ================= FILE ================= */

  it('should accept valid vehicle image', () => {

    const file = new File([''], 'bus.png', { type: 'image/png' });

    component.onVehicleImageSelect({
      target: { files: [file] }
    });

    expect(component.vehicleImage).toBe(file);
  });

  it('should reject invalid vehicle image', () => {

    const file = new File([''], 'file.txt', { type: 'text/plain' });

    component.onVehicleImageSelect({
      target: { files: [file] }
    });

    expect(component.vehicleImageError).toBe('Only JPG or PNG allowed');
  });

  /* ================= LOAD ================= */

  it('should load vehicle', () => {

    apiSpy.getVehicleById.and.returnValue(of({
      data: {
        vehicleCode: 'KA01AB1234',
        vehicleModel: 'Volvo',
        capacity: 40,
        description: 'Luxury'
      }
    }));

    component.vehicleId = 1;
    component.loadVehicle();

    expect(component.vehicleCode).toBe('KA01AB1234');
  });

  it('should load documents', () => {

    apiSpy.getDocumentsByVehicle.and.returnValue(of({
      data: [{ documentName: 'RC' }]
    }));

    component.vehicleId = 1;
    component.loadVehicleDocuments();

    expect(component.existingDocuments.length).toBe(1);
  });

  /* ================= ADD VEHICLE ================= */

  it('should call addVehicle', () => {

    component.modeOfTransport = 'Bus';
    component.vehicleCode = 'KA01AB1234';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury';
    component.vehicleImage = new File([''], 'bus.png');

    component.addVehicle();

    expect(apiSpy.addVehicle).toHaveBeenCalled();
  });

  it('should show error when add fails', () => {

    apiSpy.addVehicle.and.returnValue(
      throwError(() => new Error())
    );

    component.modeOfTransport = 'Bus';
    component.vehicleCode = 'KA01AB1234';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury';
    component.vehicleImage = new File([''], 'bus.png');

    component.addVehicle();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to add vehicle');
  });

  /* ================= UPDATE ================= */

  it('should update vehicle', () => {

    component.vehicleId = 1;
    component.capacity = 40;
    component.description = 'Updated';

    component.updateVehicle();

    expect(apiSpy.updateVehicle).toHaveBeenCalled();
  });

  /* ================= DOCUMENT ================= */

  it('should upload document', () => {

    component.vehicleId = 1;
    component.documentName = 'Insurance';
    component.documentFile = new File([''], 'doc.pdf');

    component.uploadDocument();

    expect(apiSpy.uploadVehicleDocument).toHaveBeenCalled();
  });

  /* ================= VIEW ================= */

  it('should open document', () => {

    spyOn(window, 'open');

    component.viewDocument({
      documentUrl: '/docs/test.pdf'
    });

    expect(window.open).toHaveBeenCalled();
  });

  /* ================= NAVIGATION ================= */

  it('should navigate home', () => {

    component.gotohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);
  });
  it('should enter edit vehicle mode when query param mode=vehicle', async () => {

    const activatedRouteMock = {
      snapshot: {
        queryParams: {
          mode: 'vehicle',
          id: '5'
        }
      }
    };

    await TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    const fixture2 = TestBed.createComponent(Vehicles);
    const component2 = fixture2.componentInstance;

    spyOn(component2, 'loadVehicle');

    fixture2.detectChanges(); // triggers ngOnInit

    expect(component2.isEditVehicle).toBeTrue();
    expect(component2.vehicleId).toBe(5);
    expect(component2.loadVehicle).toHaveBeenCalled();

  }); it('should enter document mode when query param mode=document', async () => {

    const activatedRouteMock = {
      snapshot: {
        queryParams: {
          mode: 'document',
          id: '10'
        }
      }
    };

    await TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    const fixture2 = TestBed.createComponent(Vehicles);
    const component2 = fixture2.componentInstance;

    spyOn(component2, 'loadVehicleDocuments');

    fixture2.detectChanges(); // triggers ngOnInit()

    expect(component2.isDocumentMode).toBeTrue();
    expect(component2.vehicleId).toBe(10);
    expect(component2.loadVehicleDocuments).toHaveBeenCalled();

  });/* ================= VEHICLE CODE EXAMPLE ================= */

  it('should return flight example', () => {

    component.modeOfTransport = 'flight';

    expect(component.vehicleCodeExample)
      .toBe('Example: AI202 or 6E123');

  });

  it('should return train example', () => {

    component.modeOfTransport = 'train';

    expect(component.vehicleCodeExample)
      .toBe('Example: 12345');

  });

  it('should return empty example for unknown transport', () => {

    component.modeOfTransport = 'ship';

    expect(component.vehicleCodeExample)
      .toBe('');

  }); it('should return bus example', () => {

    component.modeOfTransport = 'bus';

    expect(component.vehicleCodeExample)
      .toBe('Example: KA01AB1234');

  }); it('should validate flight vehicle code', () => {

    component.modeOfTransport = 'flight';
    component.vehicleCode = 'AI202';

    const result = component.validateVehicleCode();

    expect(result).toBeTrue();
    expect(component.vehicleCodeError).toBe('');

  }); it('should validate train vehicle code', () => {

    component.modeOfTransport = 'train';
    component.vehicleCode = '12345';

    const result = component.validateVehicleCode();

    expect(result).toBeTrue();
    expect(component.vehicleCodeError).toBe('');

  }); it('should return error for invalid transport mode', () => {

    component.modeOfTransport = 'ship';
    component.vehicleCode = 'ABC123';

    const result = component.validateVehicleCode();

    expect(result).toBeFalse();
    expect(component.vehicleCodeError).toBe('Invalid transport mode');

  }); it('should fail when vehicle code format is invalid', () => {

    component.modeOfTransport = 'bus';
    component.vehicleCode = 'INVALID123';

    const result = component.validateVehicleCode();

    expect(result).toBeFalse();
    expect(component.vehicleCodeError)
      .toBe('Invalid format. Example: KA01AB1234');

  }); it('should fail for invalid flight code', () => {

    component.modeOfTransport = 'flight';
    component.vehicleCode = 'A123456';

    const result = component.validateVehicleCode();

    expect(result).toBeFalse();
    expect(component.vehicleCodeError)
      .toBe('Invalid format. Example: AI202 or 6E123');

  }); it('should fail for invalid train code', () => {

    component.modeOfTransport = 'train';
    component.vehicleCode = '1234';

    const result = component.validateVehicleCode();

    expect(result).toBeFalse();
    expect(component.vehicleCodeError)
      .toBe('Invalid format. Example: 12345');

  }); it('should fail when vehicle model is empty', () => {

    component.vehicleModel = '   ';

    const result = component.validateVehicleModel();

    expect(result).toBeFalse();
    expect(component.vehicleModelError).toBe('Vehicle model required');

  }); it('should fail when vehicle model has invalid characters', () => {

    component.vehicleModel = 'Volvo@123';

    const result = component.validateVehicleModel();

    expect(result).toBeFalse();
    expect(component.vehicleModelError)
      .toBe('Only letters and numbers allowed (single space only)');

  }); it('should fail when vehicle model contains invalid characters', () => {

    component.vehicleModel = 'Volvo@9400';

    const result = component.validateVehicleModel();

    expect(result).toBeFalse();
    expect(component.vehicleModelError)
      .toBe('Only letters and numbers allowed (single space only)');

  }); it('should fail when capacity is zero', () => {

    component.capacity = 0;

    const result = component.validateCapacity();

    expect(result).toBeFalse();
    expect(component.capacityError).toBe('Capacity must be greater than 0');

  }); it('should fail when capacity is negative', () => {

    component.capacity = -5;

    const result = component.validateCapacity();

    expect(result).toBeFalse();
    expect(component.capacityError).toBe('Capacity must be greater than 0');

  }); it('should fail when description is empty', () => {

    component.description = '   ';

    const result = component.validateDescription();

    expect(result).toBeFalse();
    expect(component.descriptionError).toBe('Description required');

  }); it('should fail when document name is empty', () => {

    component.documentName = '   ';

    const result = component.validateDocumentName();

    expect(result).toBeFalse();
    expect(component.documentNameError).toBe('Document name required');

  }); it('should fail when document name contains invalid characters', () => {

    component.documentName = 'Insurance@2024';

    const result = component.validateDocumentName();

    expect(result).toBeFalse();
    expect(component.documentNameError)
      .toBe('Only letters and numbers allowed (single space only)');

  }); it('should fail when document name contains invalid characters', () => {

    component.documentName = 'Insurance@2024';

    const result = component.validateDocumentName();

    expect(result).toBeFalse();
    expect(component.documentNameError)
      .toBe('Only letters and numbers allowed (single space only)');

  }); it('should reject invalid document type', () => {

    const file = new File([''], 'doc.txt', { type: 'text/plain' });

    component.onDocumentSelect({
      target: { files: [file] }
    });

    expect(component.documentFileError).toBe('Only PDF or ZIP allowed');

  }); it('should accept valid PDF document', () => {

    const file = new File([''], 'doc.pdf', { type: 'application/pdf' });

    component.onDocumentSelect({
      target: { files: [file] }
    });

    expect(component.documentFile).toBe(file);
    expect(component.documentFileError).toBe('');

  }); it('should accept valid ZIP document', () => {

    const file = new File([''], 'doc.zip', { type: 'application/zip' });

    component.onDocumentSelect({
      target: { files: [file] }
    });

    expect(component.documentFile).toBe(file);
    expect(component.documentFileError).toBe('');

  }); it('should do nothing when no document file is selected', () => {

    component.onDocumentSelect({
      target: { files: [] }
    });

    expect(component.documentFile).toBeUndefined();

  }); it('should return early when vehicle data is null', () => {

    apiSpy.getVehicleById.and.returnValue(
      of({ data: null })
    );

    component.vehicleId = 1;

    component.loadVehicle();

    expect(component.vehicleCode).toBe('');
    expect(component.vehicleModel).toBe('');

  }); it('should show warning when form validation fails', () => {

    component.modeOfTransport = 'bus';
    component.vehicleCode = 'KA01AB1234';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury bus';
    component.vehicleImage = undefined as any; // missing image

    component.addVehicle();

    expect(toastrSpy.warning).toHaveBeenCalledWith('Please fix form errors');
    expect(apiSpy.addVehicle).not.toHaveBeenCalled();

  }); it('should show warning when vehicle code validation fails', () => {

    component.modeOfTransport = 'bus';
    component.vehicleCode = '';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury';
    component.vehicleImage = new File([''], 'bus.png');

    component.addVehicle();

    expect(toastrSpy.warning).toHaveBeenCalled();

  }); it('should show error when travel company id is missing', () => {

    apiSpy.getMyTravelCompany.and.returnValue(
      of({ data: null })
    );

    component.modeOfTransport = 'bus';
    component.vehicleCode = 'KA01AB1234';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury';
    component.vehicleImage = new File([''], 'bus.png');

    component.addVehicle();

    expect(toastrSpy.error)
      .toHaveBeenCalledWith('Company setup could not be completed. Please try again.');

    expect(component.loading).toBeFalse();
    expect(apiSpy.addVehicle).not.toHaveBeenCalled();

  }); it('should show error when fetching travel company fails', () => {

    apiSpy.getMyTravelCompany.and.returnValue(
      throwError(() => new Error('API error'))
    );

    component.modeOfTransport = 'bus';
    component.vehicleCode = 'KA01AB1234';
    component.vehicleModel = 'Volvo';
    component.capacity = 40;
    component.description = 'Luxury';
    component.vehicleImage = new File([''], 'bus.png');

    component.addVehicle();

    expect(component.loading).toBeFalse();
    expect(toastrSpy.error)
      .toHaveBeenCalledWith('Failed to fetch travel company');

  }); it('should not update vehicle when validation fails', () => {

    component.vehicleId = 1;
    component.capacity = 0;          // invalid capacity
    component.description = 'Valid description';

    component.updateVehicle();

    expect(apiSpy.updateVehicle).not.toHaveBeenCalled();

  }); it('should not update vehicle when description is empty', () => {

    component.vehicleId = 1;
    component.capacity = 40;
    component.description = '   ';   // invalid description

    component.updateVehicle();

    expect(apiSpy.updateVehicle).not.toHaveBeenCalled();

  }); it('should append vehicle image when updating vehicle', () => {

    component.vehicleId = 1;
    component.capacity = 40;
    component.description = 'Updated vehicle';
    component.vehicleImage = new File([''], 'bus.png', { type: 'image/png' });

    component.updateVehicle();

    expect(apiSpy.updateVehicle).toHaveBeenCalled();

  }); it('should update vehicle without image when no image is provided', () => {

    component.vehicleId = 1;
    component.capacity = 40;
    component.description = 'Updated vehicle';
    component.vehicleImage = undefined as any;

    component.updateVehicle();

    expect(apiSpy.updateVehicle).toHaveBeenCalled();

  }); it('should not upload document when file is missing', () => {

    component.vehicleId = 1;
    component.documentName = 'Insurance';
    component.documentFile = undefined as any;

    component.uploadDocument();

    expect(apiSpy.uploadVehicleDocument).not.toHaveBeenCalled();

  }); it('should not upload document when document name validation fails', () => {

    component.vehicleId = 1;
    component.documentName = ''; // invalid
    component.documentFile = new File([''], 'doc.pdf', { type: 'application/pdf' });

    component.uploadDocument();

    expect(apiSpy.uploadVehicleDocument).not.toHaveBeenCalled();

  }); it('should return early when documentUrl is missing in viewDocument', () => {

    spyOn(window, 'open');

    component.viewDocument({
      documentUrl: ''
    });

    expect(window.open).not.toHaveBeenCalled();

  }); it('should return early when documentUrl is missing in downloadDocument', () => {

    spyOn(document, 'createElement');

    component.downloadDocument({
      documentUrl: ''
    });

    expect(document.createElement).not.toHaveBeenCalled();

  }); it('should return early when documentUrl is missing', () => {

    spyOn(document, 'createElement');

    component.downloadDocument({ documentUrl: '' });

    expect(document.createElement).not.toHaveBeenCalled();

  }); it('should create link and download document', () => {

    const linkMock = {
      href: '',
      download: '',
      click: jasmine.createSpy('click')
    } as any;

    spyOn(document, 'createElement').and.returnValue(linkMock);
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.downloadDocument({
      documentUrl: '/docs/test.pdf',
      documentName: 'test.pdf'
    });

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(linkMock.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();

  });
});
