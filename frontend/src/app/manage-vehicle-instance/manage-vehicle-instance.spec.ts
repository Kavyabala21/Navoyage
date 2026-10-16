import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageVehicleInstance } from './manage-vehicle-instance';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('ManageVehicleInstance Component', () => {

  let component: ManageVehicleInstance;
  let fixture: ComponentFixture<ManageVehicleInstance>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const routeMock = {
    queryParams: of({ vehicleId: 1 })
  };

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getRoutes',
      'getVehicleInstanceByVehicleId',
      'deleteVehicleInstance'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ManageVehicleInstance],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageVehicleInstance);
    component = fixture.componentInstance;

    apiSpy.getRoutes.and.returnValue(
      of({ status: true, data: [] })
    );

    apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
      of({ status: true, data: [] })
    );

    apiSpy.deleteVehicleInstance.and.returnValue(
      of({ status: true, data: null })
    );
  });

  /* ================= INIT ================= */

  it('should initialize with vehicleId and load data', () => {

    spyOn(component, 'loadRoutes');
    spyOn(component, 'loadInstances');

    component.ngOnInit();

    expect(component.vehicleId).toBe(1);
    expect(component.loadRoutes).toHaveBeenCalled();
    expect(component.loadInstances).toHaveBeenCalled();
  });

  /* ================= ROUTES ================= */

  it('should load routes successfully', () => {

    apiSpy.getRoutes.and.returnValue(
      of({
        status: true,
        data: [{ routeId: 1, routeName: 'Route A' }]
      })
    );

    component.loadRoutes();

    expect(component.routes.length).toBe(1);
    expect(component.routeMap[1]).toBe('Route A');
  });

  it('should handle route load error', () => {

    apiSpy.getRoutes.and.returnValue(
      throwError(() => new Error())
    );

    component.loadRoutes();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load routes');
  });

  /* ================= INSTANCES ================= */

  it('should load vehicle instances array', () => {

    apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
      of({
        status: true,
        data: [{ instanceId: 10 }]
      })
    );

    component.vehicleId = 1;
    component.loadInstances();

    expect(component.vehicleInstances.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle empty instance response', () => {

    apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
      of({
        status: true,
        data: []
      })
    );

    component.vehicleId = 1;
    component.loadInstances();

    expect(component.vehicleInstances.length).toBe(0);
  });

  it('should handle instance load error', () => {

    apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
      throwError(() => new Error())
    );

    component.vehicleId = 1;
    component.loadInstances();

    expect(component.vehicleInstances.length).toBe(0);
    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load vehicle instances');
  });

  /* ================= EDIT ================= */

  it('should navigate to edit instance', () => {

    component.editInstance(5);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/vehicleinstance'],
      { queryParams: { instanceId: 5 } }
    );
  });

  /* ================= DELETE ================= */

  it('should delete instance when confirmed', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    component.vehicleInstances = [{ instanceId: 10 }];

    component.confirmDelete({ instanceId: 10 });

    expect(apiSpy.deleteVehicleInstance).toHaveBeenCalledWith(10);
  });

  it('should not delete if confirm cancelled', () => {

    spyOn(window, 'confirm').and.returnValue(false);

    component.confirmDelete({ instanceId: 10 });

    expect(apiSpy.deleteVehicleInstance).not.toHaveBeenCalled();
  });

  it('should remove instance after delete success', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    component.vehicleInstances = [{ instanceId: 10 }];

    component.confirmDelete({ instanceId: 10 });

    expect(component.vehicleInstances.length).toBe(0);
  });

  it('should handle delete error', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    apiSpy.deleteVehicleInstance.and.returnValue(
      throwError(() => new Error())
    );

    component.confirmDelete({ instanceId: 10 });

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to remove instance');
  });

  /* ================= NAVIGATION ================= */

  it('should navigate back to vehicles page', () => {

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);
  });
/* ================= NO VEHICLE ID ================= */

it('should show error and redirect if vehicleId missing', () => {

  const routeWithoutVehicle = {
    queryParams: of({})
  };

  const fixture2 = TestBed.createComponent(ManageVehicleInstance);
  const component2 = fixture2.componentInstance;

  // override the route inside the component
  (component2 as any).route = routeWithoutVehicle;

  component2.ngOnInit();

  expect(toastrSpy.error).toHaveBeenCalledWith('Vehicle not selected');
  expect(routerSpy.navigate).toHaveBeenCalledWith(['/my-vehicles']);
});
it('should wrap single instance object into array', () => {

  apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
    of({
      status: true,
      data: { instanceId: 20 }
    }as any)
  );

  component.vehicleId = 1;
  component.loadInstances();

  expect(component.vehicleInstances.length).toBe(1);
  expect(component.vehicleInstances[0].instanceId).toBe(20);
});
it('should set vehicleInstances empty when data is null', () => {

  apiSpy.getVehicleInstanceByVehicleId.and.returnValue(
    of({
      status: true,
      data: undefined as any
    })
  );

  component.vehicleId = 1;
  component.loadInstances();

  expect(component.vehicleInstances).toEqual([]);
});
});