import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleInstance } from './vehicle-instance';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('VehicleInstance Component', () => {

  let component: VehicleInstance;
  let fixture: ComponentFixture<VehicleInstance>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const routeMock = {
    queryParams: of({
      vehicleId: '1',
      instanceId: '2'
    })
  };

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getRoutes',
      'getVehicleById',
      'getVehicleInstanceById',
      'addVehicleInstance',
      'updateVehicleInstance'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VehicleInstance],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleInstance);
    component = fixture.componentInstance;

    apiSpy.getRoutes.and.returnValue(of({ status:true,data: [] }));
    apiSpy.getVehicleById.and.returnValue(of({ data: { capacity: 40 } }));
  apiSpy.getVehicleInstanceById.and.returnValue(of({
  status: true,
  data: {
    instanceId: 2,
    vehicleId: 1,
    routeId: 5,
    departureDate: '2026-01-01T00:00:00',
    arrivalDate: '2026-01-01T00:00:00',
    departureTime: '10:00:00',
    arrivalTime: '12:00:00',
    totalSeats: 40,
    availableSeats: 40,
    status: 'Scheduled'
  }
} as any));

    apiSpy.addVehicleInstance.and.returnValue(of({}));
    apiSpy.updateVehicleInstance.and.returnValue(of({}));

    fixture.detectChanges();
  });

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load routes on init', () => {
    expect(apiSpy.getRoutes).toHaveBeenCalled();
  });

  it('should load vehicle capacity', () => {
    component.loadVehicleCapacity(1);
    expect(component.model.totalSeats).toBe(40);
  });

  /* ---------------- ROUTES ---------------- */

  it('should handle route loading error', () => {

    apiSpy.getRoutes.and.returnValue(
      throwError(() => new Error())
    );

    component.loadRoutes();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load routes');
  });

  /* ---------------- INSTANCE ---------------- */

  it('should load instance in edit mode', () => {

    component.loadInstance(2);

    expect(component.model.instanceId).toBe(2);
    expect(component.model.routeId).toBe(5);
  });

  it('should handle instance load error', () => {

    apiSpy.getVehicleInstanceById.and.returnValue(
      throwError(() => new Error())
    );

    component.loadInstance(2);

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load instance');
  });

  /* ---------------- DATE VALIDATION ---------------- */

  it('should detect invalid arrival date', () => {

    component.model.departureDate = '2026-01-02';
    component.model.arrivalDate = '2026-01-01';

    component.validateDates();

    expect(component.dateError).toBeTrue();
  });

  it('should detect invalid arrival time on same date', () => {

    component.model.departureDate = '2026-01-01';
    component.model.arrivalDate = '2026-01-01';
    component.model.departureTime = '10:00';
    component.model.arrivalTime = '09:00';

    component.validateDates();

    expect(component.dateError).toBeTrue();
  });

  it('should allow valid arrival date', () => {

    component.model.departureDate = '2026-01-01';
    component.model.arrivalDate = '2026-01-02';

    component.validateDates();

    expect(component.dateError).toBeFalse();
  });

  /* ---------------- SEAT VALIDATION ---------------- */

  it('should detect invalid available seats', () => {

    component.model.totalSeats = 10;
    component.model.availableSeats = 20;

    component.validateAvailableSeats();

    expect(component.seatError).toBeTrue();
  });

  it('should sync available seats', () => {

    component.model.totalSeats = 30;

    component.syncAvailableSeats();

    expect(component.model.availableSeats).toBe(30);
  });

  /* ---------------- ADD INSTANCE ---------------- */

  it('should add vehicle instance', () => {

    component.isEditMode = false;

    component.submit();

    expect(apiSpy.addVehicleInstance).toHaveBeenCalled();
  });

  it('should handle add instance error', () => {

    component.isEditMode = false;

    apiSpy.addVehicleInstance.and.returnValue(
      throwError(() => new Error())
    );

    component.submit();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to add vehicle instance');
  });

  /* ---------------- UPDATE INSTANCE ---------------- */

  it('should update vehicle instance', () => {

    component.isEditMode = true;

    component.submit();

    expect(apiSpy.updateVehicleInstance).toHaveBeenCalled();
  });

  it('should handle update error', () => {

    component.isEditMode = true;

    apiSpy.updateVehicleInstance.and.returnValue(
      throwError(() => new Error())
    );

    component.submit();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to update vehicle instance');
  });

  /* ---------------- NAVIGATION ---------------- */

  it('should navigate back', () => {

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);
  });

});