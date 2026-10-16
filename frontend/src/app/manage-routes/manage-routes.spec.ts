import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageRoutes } from './manage-routes';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ManageRoutes Component', () => {

  let component: ManageRoutes;
  let fixture: ComponentFixture<ManageRoutes>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj('Api_Calls', [
      'getRoutesByOwnerId',
      'getAllStops',
      'addRoute',
      'updateRoute',
      'getAllRouteStopPoints',
      'getRouteStopPointsByRouteId',
      'deleteRouteStopPoint',
      'addRouteStopPoint'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    apiSpy.getRoutesByOwnerId.and.returnValue(
      of({ status: true, data: [] })
    );

    apiSpy.getAllStops.and.returnValue(
      of({ status: true, data: [] })
    );

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({ status: true, data: [] })
    );

    apiSpy.addRoute.and.returnValue(
      of({ status: true, data: { routeId: 1 } })
    );

    apiSpy.updateRoute.and.returnValue(
      of({ status: true, data: null })
    );

    apiSpy.deleteRouteStopPoint.and.returnValue(
      of({ status: true, data: null })
    );

    apiSpy.addRouteStopPoint.and.returnValue(
      of({ status: true, data: null })
    );

    await TestBed.configureTestingModule({
      imports: [ManageRoutes],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageRoutes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* ---------------- CREATE ---------------- */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ---------------- INIT ---------------- */

  it('should call loadRoutes and loadStops on init', () => {

    const routesSpy = spyOn(component, 'loadRoutes');
    const stopsSpy = spyOn(component, 'loadStops');

    component.ngOnInit();

    expect(routesSpy).toHaveBeenCalled();
    expect(stopsSpy).toHaveBeenCalled();
  });

  /* ---------------- LOAD ROUTES ---------------- */

  it('should load routes successfully', () => {

    apiSpy.getRoutesByOwnerId.and.returnValue(
      of({
        status: true,
        data: [{ routeId: 1 }]
      })
    );

    component.loadRoutes();

    expect(component.routes.length).toBe(1);
  });

  it('should show error when routes fail to load', () => {

    apiSpy.getRoutesByOwnerId.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.loadRoutes();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load routes');
  });

  it('should show error when routes API returns false status', () => {
    apiSpy.getRoutesByOwnerId.and.returnValue(
      of({ status: false, data: [] })
    );

    component.loadRoutes();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load routes');
  });

  /* ---------------- LOAD STOPS ---------------- */

  it('should load stops', () => {
    apiSpy.getAllStops.and.returnValue(
      of({
        status: true,
        data: [{ stopId: 1 }]
      })
    );

    component.loadStops();

    expect(component.stops.length).toBe(1);
  });

  it('should show error when stops API returns false status', () => {
    apiSpy.getAllStops.and.returnValue(
      of({ status: false, data: [] })
    );

    component.loadStops();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load stops');
  });

  it('should show error when stops request fails', () => {
    apiSpy.getAllStops.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.loadStops();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load stops');
  });

  it('should reset filtered routes when route search is empty', () => {
    component.routes = [
      { routeId: 1, routeName: 'Blue Line' },
      { routeId: 2, routeName: 'Green Line' }
    ];
    component.routeSearch = '';

    component.searchRoutes();

    expect(component.filteredRoutes).toEqual(component.routes);
  });

  it('should filter routes by name or id', () => {
    component.routes = [
      { routeId: 12, routeName: 'Blue Line' },
      { routeId: 34, routeName: 'Green Line' }
    ];
    component.routeSearch = '34';

    component.searchRoutes();

    expect(component.filteredRoutes).toEqual([{ routeId: 34, routeName: 'Green Line' }]);
  });

  it('should reset filtered stops when stop search is empty', () => {
    component.stops = [
      { stopId: 1, stopName: 'A' },
      { stopId: 2, stopName: 'B' }
    ];
    component.stopSearch = '';

    component.searchStops();

    expect(component.filteredStops).toEqual(component.stops);
  });

  it('should filter stops by name', () => {
    component.stops = [
      { stopId: 1, stopName: 'Central' },
      { stopId: 2, stopName: 'North' }
    ];
    component.stopSearch = 'cen';

    component.searchStops();

    expect(component.filteredStops).toEqual([{ stopId: 1, stopName: 'Central' }]);
  });

  /* ---------------- SELECT ROUTE ---------------- */

  it('should select route', () => {

    const route = { routeId: 1 };

    component.selectRoute(route);

    expect(component.selectedRoute).toEqual(route);
  });

  /* ---------------- ENABLE ADD ---------------- */

  it('should enable add mode', () => {

    component.enableAdd();

    expect(component.formVisible).toBeTrue();
    expect(component.isEditMode).toBeFalse();
  });

  /* ---------------- ENABLE EDIT ---------------- */

  it('should warn if no route selected', () => {

    component.selectedRoute = null;

    component.enableEdit();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should enable edit mode', () => {

    const route = { routeId: 1 };

    component.selectedRoute = route;

    spyOn(component, 'editRoute');

    component.enableEdit();

    expect(component.isEditMode).toBeTrue();
    expect(component.editRoute).toHaveBeenCalledWith(route);
  });

  /* ---------------- STOP MANAGEMENT ---------------- */

  it('should add stop', () => {

    const stop = { stopId: 1 };

    component.addStop(stop);

    expect(component.selectedStops.length).toBe(1);
  });

  it('should prevent duplicate stop', () => {

    const stop = { stopId: 1 };

    component.selectedStops = [stop];

    component.addStop(stop);

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should remove stop', () => {

    component.selectedStops = [{ stopId: 1 }];

    component.removeStop(0);

    expect(component.selectedStops.length).toBe(0);
  });

  /* ---------------- MOVE STOPS ---------------- */

  it('should move stop up', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    component.moveUp(1);

    expect(component.selectedStops[0].stopId).toBe(2);
  });

  it('should move stop down', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    component.moveDown(0);

    expect(component.selectedStops[1].stopId).toBe(1);
  });

  /* ---------------- SAVE ROUTE VALIDATION ---------------- */

  it('should show error if route invalid', () => {

    component.routeName = '';
    component.selectedStops = [];

    component.saveRoute();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  /* ---------------- SAVE NEW ROUTE ---------------- */

  it('should create route', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.addRoute.and.returnValue(
      of({
        status: true,
        data: { routeId: 10 }
      })
    );

    spyOn(component, 'saveStopPoints');

    component.saveRoute();

    expect(apiSpy.addRoute).toHaveBeenCalled();
  });

  /* ---------------- SAVE STOP POINTS ---------------- */

  it('should save stop points', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.addRouteStopPoint.and.returnValue(
      of({ status: true, data: null })
    );
    component.saveStopPoints(1);

    expect(apiSpy.addRouteStopPoint).toHaveBeenCalled();
  });

  it('should show error if no stops selected', () => {

    component.selectedStops = [];

    component.saveStopPoints(1);

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  /* ---------------- EDIT ROUTE ---------------- */

  it('should edit route', () => {

    const route = { routeId: 1, routeName: 'Test' };

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({
        status: true,
        data: []
      })
    );

    component.editRoute(route);

    expect(component.editingRouteId).toBe(1);
  });

  /* ---------------- RESET FORM ---------------- */

  it('should reset form', () => {

    component.routeName = 'Test';
    component.selectedStops = [{ stopId: 1 }];
    component.editingRouteId = 1;

    component.resetForm();

    expect(component.routeName).toBe('');
    expect(component.selectedStops.length).toBe(0);
  });

  /* ---------------- NAVIGATION ---------------- */

  it('should navigate to stops page', () => {

    component.gotoStops();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/stop']);
  });
  /* ---------------- CANCEL FORM ---------------- */

 it('should cancel form and reset fields', () => {

  component.formVisible = false;
  component.isEditMode = true;

  spyOn(component, 'resetForm');

  component.cancelForm();

  expect(component.formVisible).toBeTrue();
  expect(component.isEditMode).toBeFalse();
  expect(component.resetForm).toHaveBeenCalled();
});
/* ---------------- MOVE UP EDGE CASE ---------------- */

  it('should not move stop up if index is 0', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    component.moveUp(0);

    expect(component.selectedStops[0].stopId).toBe(1);
  }); it('should not move stop down when index is last element', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    const original = [...component.selectedStops];

    component.moveDown(1);   // last index

    expect(component.selectedStops).toEqual(original);
  });/* ---------------- INVALID ROUTE ID ---------------- */

  it('should show error if routeId not returned from server', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.addRoute.and.returnValue(
      of({
        status: true,
        data: {}   // routeId missing
      })
    );

    component.saveRoute();

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Invalid route ID returned from server'
    );
  });/* ---------------- CREATE ROUTE ERROR ---------------- */

  it('should show error when route creation fails', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.addRoute.and.returnValue(
      throwError(() => new Error())
    );

    component.saveRoute();

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Failed to create route'
    );
  }); it('should call saveStopPoints when no existing stop points', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];
    component.editingRouteId = 1;

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({ status: true, data: [] })
    );

    spyOn(component, 'saveStopPoints');

    component.saveRoute();

    expect(component.saveStopPoints).toHaveBeenCalledWith(1);
  }); it('should show error when loading existing stop points fails', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];
    component.editingRouteId = 1;

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      throwError(() => new Error())
    );

    component.saveRoute();

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Failed to load existing stop points'
    );
  }); it('should show error when updateRoute fails', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];
    component.editingRouteId = 1;

    apiSpy.updateRoute.and.returnValue(
      throwError(() => new Error())
    );

    component.saveRoute();

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Failed to update route'
    );
  });

  it('should use route-specific stop points during update', () => {

    component.editingRouteId = 1;
    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({
        status: true,
        data: [
          { routeId: 1, routeStopPointId: 10 }
        ]
      })
    );

    spyOn(component, 'saveStopPoints');

    component.saveRoute();

    expect(component.saveStopPoints).toHaveBeenCalledWith(1);
  });

  it('should handle missing stop-point data during update by saving new points directly', () => {
    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];
    component.editingRouteId = 1;

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({ status: true } as any)
    );

    spyOn(component, 'saveStopPoints');

    component.saveRoute();

    expect(component.saveStopPoints).toHaveBeenCalledWith(1);
  });
  /* ---------------- DELETE OLD STOP POINTS ERROR ---------------- */

  it('should show error when forkJoin delete fails', () => {

    component.routeName = 'Test Route';
    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];
    component.editingRouteId = 1;

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({
        status: true,
        data: [
          { routeId: 1, routeStopPointId: 10 },
          { routeId: 1, routeStopPointId: 11 }
        ]
      })
    );

    apiSpy.deleteRouteStopPoint.and.returnValue(
      throwError(() => new Error())
    );

    component.saveRoute();

    expect(apiSpy.deleteRouteStopPoint).toHaveBeenCalled();
    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Failed to remove old stop points'
    );
  }); it('should show error when saving stop points fails', () => {

    component.selectedStops = [
      { stopId: 1, sequenceOrder: 1 },
      { stopId: 2, sequenceOrder: 2 }
    ];

    apiSpy.addRouteStopPoint.and.returnValue(
      throwError(() => new Error())
    );

    component.saveStopPoints(1);

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Failed to save stop points'
    );
  });
  /* ---------------- EDIT ROUTE FILTER + SORT + MAP ---------------- */

  it('should sort and map route stop points when editing route', () => {

    const route = { routeId: 1, routeName: 'Test Route' };

    apiSpy.getRouteStopPointsByRouteId.and.returnValue(
      of({
        status: true,
        data: [
          { routeId: 1, stopId: 2, sequenceOrder: 2, stop: { stopName: 'B' } },
          { routeId: 1, stopId: 1, sequenceOrder: 1, stop: { stopName: 'A' } }
        ]
      })
    );

    component.editRoute(route);

    expect(component.selectedStops.length).toBe(2);

    expect(component.selectedStops[0]).toEqual({
      stopId: 1,
      stopName: 'A',
      sequenceOrder: 1
    });

    expect(component.selectedStops[1]).toEqual({
      stopId: 2,
      stopName: 'B',
      sequenceOrder: 2
    });
  });
});
