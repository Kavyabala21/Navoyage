import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AllVehicles } from './all-vehicles';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { AuthSignal } from '../core/auth/auth-signal';
import { Api_Calls } from 'src/Shared/Services/api-calls';

describe('AllVehicles', () => {

  let component: AllVehicles;
  let fixture: ComponentFixture<AllVehicles>;

  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let facadeSpy: jasmine.SpyObj<DataFacade>;
  let authSpy: jasmine.SpyObj<AuthSignal>;
  let apiCallsSpy: jasmine.SpyObj<Api_Calls>;

  const vehicles$ = new Subject<any[]>();
  const vehicleDocs$ = new Subject<any[]>();
  const vehicleInstances$ = new Subject<any[]>();
const mockUser = {
  id: 1,
  name: 'Test Owner',
  email: 'owner@test.com',
  role: 'Owner',
  phoneNumber: '9999999999',
  isLoggedIn: true,
  InLoginPage: false
};
  beforeEach(async () => {

    toastrSpy = jasmine.createSpyObj('ToastrService', ['error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    facadeSpy = jasmine.createSpyObj('DataFacade', [
      'loadAllVehicles',
      'loadVehicleDocuments',
      'loadVehicleInstancesByVehicleId',
      'deactivateVehicle'
    ], {
      vehicles$: vehicles$,
      vehicleDocuments$: vehicleDocs$,
      vehicleInstances$: vehicleInstances$
    });

    authSpy = jasmine.createSpyObj('AuthSignal', ['user']);
    apiCallsSpy = jasmine.createSpyObj('Api_Calls', ['getSeatLayoutByVehicleId']);
    apiCallsSpy.getSeatLayoutByVehicleId.and.returnValue(of({ data: null }));

    await TestBed.configureTestingModule({
      imports: [AllVehicles],
      providers: [
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DataFacade, useValue: facadeSpy },
        { provide: AuthSignal, useValue: authSpy },
        { provide: Api_Calls, useValue: apiCallsSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AllVehicles);
    component = fixture.componentInstance;
  });

  /* ================= INIT ================= */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should show error if owner not found', () => {

    authSpy.user.and.returnValue(null);

    component.ngOnInit();

    expect(toastrSpy.error).toHaveBeenCalledWith('Owner session not found. Please sign in again.');
  });

  it('should load vehicles on init', () => {
authSpy.user.and.returnValue(mockUser);
sessionStorage.setItem('transportMode', 'Bus');

    component.ngOnInit();

    expect(facadeSpy.loadAllVehicles).toHaveBeenCalled();
  });

  it('should filter vehicles for owner and mode', () => {

authSpy.user.and.returnValue(mockUser);
    sessionStorage.setItem('transportMode', 'Bus');

    component.ngOnInit();

    vehicles$.next([
      {
        vehicleId: 1,
        vehicleCode: 'BUS001',
        modeOfTransport: 'Bus',
        travelCompany: { ownerId: 1 }
      },
      {
        vehicleId: 2,
        vehicleCode: 'BUS002',
        modeOfTransport: 'Train',
        travelCompany: { ownerId: 1 }
      }
    ]);

    expect(component.ownerVehicles.length).toBe(1);
  });

  it('should store seat layout existence for owner vehicles', () => {
    authSpy.user.and.returnValue(mockUser);
    sessionStorage.setItem('transportMode', 'Bus');
    apiCallsSpy.getSeatLayoutByVehicleId.and.callFake((vehicleId: number) =>
      of({ data: vehicleId === 1 ? { layoutJSON: '{}' } : null })
    );

    component.ngOnInit();

    vehicles$.next([
      {
        vehicleId: 1,
        vehicleCode: 'BUS001',
        modeOfTransport: 'Bus',
        travelCompany: { ownerId: 1 }
      },
      {
        vehicleId: 2,
        vehicleCode: 'BUS002',
        modeOfTransport: 'Bus',
        travelCompany: { ownerId: 1 }
      }
    ]);

    expect(component.seatLayoutExists[1]).toBeTrue();
    expect(component.seatLayoutExists[2]).toBeFalse();
  });

  it('should mark seat layout as missing when API call fails', () => {
    authSpy.user.and.returnValue(mockUser);
    sessionStorage.setItem('transportMode', 'Bus');
    apiCallsSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: '{}' } })
    );

    component.ngOnInit();

    apiCallsSpy.getSeatLayoutByVehicleId.and.returnValue(
      throwError(() => new Error('seat layout failed'))
    );

    vehicles$.next([
      {
        vehicleId: 3,
        vehicleCode: 'BUS003',
        modeOfTransport: 'Bus',
        travelCompany: { ownerId: 1 }
      }
    ]);

    expect(component.seatLayoutExists[3]).toBeFalse();
  });

  /* ================= MODALS ================= */

  it('should open vehicle details', () => {

    const vehicle = { vehicleId: 1 };

    component.openVehicleDetails(vehicle);

    expect(component.selectedVehicle).toEqual(vehicle);
    expect(facadeSpy.loadVehicleDocuments).toHaveBeenCalledWith(1);
  });

  it('should open vehicle instances modal', () => {

    const vehicle = { vehicleId: 5 };

    component.openVehicleInstances(vehicle);

    expect(component.showInstancesModal).toBeTrue();
    expect(component.instancesLoading).toBeTrue();
    expect(facadeSpy.loadVehicleInstancesByVehicleId).toHaveBeenCalledWith(5);
  });

  it('should close instances modal', () => {

    component.showInstancesModal = true;
    component.vehicleInstances = [1,2];

    component.closeInstancesModal();

    expect(component.showInstancesModal).toBeFalse();
    expect(component.vehicleInstances.length).toBe(0);
  });

  /* ================= FILTERS ================= */

  it('should filter vehicles by search', () => {

    component.ownerVehicles = [
      { vehicleModel: 'Volvo', vehicleCode: 'BUS01', isActive: true },
      { vehicleModel: 'Benz', vehicleCode: 'BUS02', isActive: true }
    ];

    component.searchText = 'volvo';

    component.applyFilters();

    expect(component.filteredVehicles.length).toBe(1);
  });

  it('should filter by active status', () => {

    component.ownerVehicles = [
      { vehicleModel:'A', vehicleCode:'A', isActive:true },
      { vehicleModel:'B', vehicleCode:'B', isActive:false }
    ];

    component.statusFilter = 'active';

    component.applyFilters();

    expect(component.filteredVehicles.length).toBe(1);
  });

  it('should filter verification status', () => {

    component.vehicleDocuments = [
      { status:'Approved' },
      { status:'Pending' }
    ];

    component.verificationFilter = 'approved';

    component.applyFilters();

    expect(component.verificationStatus.length).toBe(1);
  });

  /* ================= VEHICLE ACTIONS ================= */

  it('should deactivate vehicle', () => {

    component.ownerVehicles = [
      { vehicleId:1, isActive:true }
    ];

    component.deactivateVehicle(1);

    expect(facadeSpy.deactivateVehicle).toHaveBeenCalledWith(1);
    expect(component.ownerVehicles[0].isActive).toBeFalse();
  });

  it('should confirm deactivate', () => {

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'deactivateVehicle');

    component.confirmDeactivate({
      vehicleId:1,
      vehicleCode:'BUS01'
    });

    expect(component.deactivateVehicle).toHaveBeenCalledWith(1);
  });

  /* ================= NAVIGATION ================= */

  it('should navigate to edit vehicle', () => {

    component.editVehicle(10);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/vehicles'],
      { queryParams:{ id:10, mode:'vehicle'} }
    );
  });

  it('should navigate to edit documents', () => {

    component.editDocuments(10);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/vehicles'],
      { queryParams:{ id:10, mode:'document'} }
    );
  });

  it('should toggle menu', () => {

    component.toggleMenu('BUS01');
    expect(component.openMenuFor).toBe('BUS01');

    component.toggleMenu('BUS01');
    expect(component.openMenuFor).toBeNull();
  });

  it('should view vehicle details', () => {

    const vehicle = { vehicleId:1 };

    component.viewDetails(vehicle);

    expect(component.selectedVehicle).toEqual(vehicle);
  });

  it('should close modal', () => {

    component.selectedVehicle = { vehicleId:1 };

    component.closeModal();

    expect(component.selectedVehicle).toBeNull();
  });

  /* ================= IMAGE ================= */

  it('should construct image URL', () => {

    const url = component.getImage('/img.jpg');

    expect(url).toBe('http://localhost:5000/img.jpg');
  });

  /* ================= DASHBOARD ================= */

  it('should go to dashboard', () => {

    sessionStorage.setItem('transportMode','Bus');

    component.gotohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  /* ================= INSTANCE NAVIGATION ================= */

  it('should navigate to add instance', () => {

    component.addInstance(5);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/vehicleinstance'],
      { queryParams:{ vehicleId:5 }}
    );
  });

  it('should navigate to manage instance', () => {

    component.manageVehicleInstance(5);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/managevehicleinstance'],
      { queryParams:{ vehicleId:5 }}
    );
  });

  it('should navigate to seat layout', () => {

    component.gotoSeatLayout(10,true);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/seatlayout'],
      { queryParams:{ vehicleId:10, edit:true }}
    );
  });

  it('should navigate to train prices', () => {
    component.gotoTrainPrices(8);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/trainprices'],
      { queryParams: { vehicleId: 8 } }
    );
  });

  /* ================= DESTROY ================= */

  it('should complete destroy subject', () => {

    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
it('should update vehicleDocuments when facade emits documents', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  spyOn(component, 'applyFilters');

  component.ngOnInit();

  const docs = [
    { vehicleId: 1, status: 'Approved' },
    { vehicleId: 2, status: 'Pending' }
  ];

  vehicleDocs$.next(docs);

  expect(component.vehicleDocuments).toEqual(docs);
  expect(component.applyFilters).toHaveBeenCalled();
});
it('should update vehicleInstances when facade emits instances', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  component.ngOnInit();

  const instances = [
    { instanceId: 1 },
    { instanceId: 2 }
  ];

  vehicleInstances$.next(instances);

  expect(component.vehicleInstances).toEqual(instances);
  expect(component.instancesLoading).toBeFalse();
});
it('should set empty array if documents are null', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  component.ngOnInit();

  vehicleDocs$.next(null as any);

  expect(component.vehicleDocuments).toEqual([]);
});
it('should set empty instances if facade returns null', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  component.ngOnInit();

  vehicleInstances$.next(null as any);

  expect(component.vehicleInstances).toEqual([]);
});
it('should set empty instances if facade returns null', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  component.ngOnInit();

  component.instancesLoading = true; // simulate loading state

  vehicleInstances$.next(null as any);

  expect(component.vehicleInstances).toEqual([]);
  expect(component.instancesLoading).toBeFalse();
});
it('should update vehicleInstances when instances are returned', () => {

  authSpy.user.and.returnValue({
    id: 1,
    name: 'Owner',
    email: 'owner@test.com',
    role: 'Owner',
    phoneNumber: '9999999999',
    isLoggedIn: true,
    InLoginPage: false
  });

  sessionStorage.setItem('transportMode', 'Bus');

  component.ngOnInit();

  const instances = [
    { instanceId: 1 },
    { instanceId: 2 }
  ];

  vehicleInstances$.next(instances);

  expect(component.vehicleInstances).toEqual(instances);
});
it('should navigate to edit vehicle instance page', () => {

  const vehicleId = 10;

  component.editInstance(vehicleId);

  expect(routerSpy.navigate).toHaveBeenCalledWith(
    ['/vehicleinstance'],
    { queryParams: { vehicleId: 10 } }
  );
});
it('should not deactivate vehicle when user cancels confirmation', () => {

  const vehicle = {
    vehicleId: 1,
    vehicleCode: 'BUS01'
  };

  spyOn(window, 'confirm').and.returnValue(false);
  spyOn(component, 'deactivateVehicle');

  component.confirmDeactivate(vehicle);

  expect(component.deactivateVehicle).not.toHaveBeenCalled();
});
it('should deactivate vehicle when confirmation is accepted', () => {

  const vehicle = {
    vehicleId: 1,
    vehicleCode: 'BUS01'
  };

  spyOn(window, 'confirm').and.returnValue(true);
  spyOn(component, 'deactivateVehicle');

  component.confirmDeactivate(vehicle);

  expect(component.deactivateVehicle).toHaveBeenCalledWith(1);
});
});
