import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Search } from './search';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthSignal } from '../core/auth/auth-signal';
import { BehaviorSubject, of, throwError } from 'rxjs';

describe('Search Component', () => {

  let component: Search;
  let fixture: ComponentFixture<Search>;

  let facadeSpy: jasmine.SpyObj<DataFacade>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let authSpy: jasmine.SpyObj<AuthSignal>;

  beforeEach(async () => {

    sessionStorage.clear();

    facadeSpy = jasmine.createSpyObj<DataFacade>(
      'DataFacade',
      ['loadAllStops', 'searchVehicleInstances'],
      {
        vehicleInstances$: new BehaviorSubject<any[]>([]),
        stops$: new BehaviorSubject<any[]>([])
      }
    );

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'distance',
      'getSeatLayoutByVehicleId',
      'getAverageRating',
      'getReviewsByVehicle'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'warning',
      'error',
      'success'
    ]);

    authSpy = jasmine.createSpyObj('AuthSignal', ['user']);

    authSpy.user.and.returnValue({
      id: 1,
      name: 'TestUser',
      email: 'test@test.com',
      phoneNumber: '9999999999',
      role: 'Customer',
      isLoggedIn: true,
      InLoginPage: false
    });

    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [
        { provide: DataFacade, useValue: facadeSpy },
        { provide: Api_Calls, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: AuthSignal, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    component = fixture.componentInstance;

    (component as any).map = {
      invalidateSize: jasmine.createSpy('invalidateSize')
    };

    apiSpy.distance.and.returnValue(of({ status: true, data: 10 }));
    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: '{"seats":[{"BasePrice":100}]}' } })
    );
    apiSpy.getAverageRating.and.returnValue(of({ data: 4 }));

    sessionStorage.setItem('transportMode', 'Bus');

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data', () => {
    component.loadUser();

    expect(component.username).toBe('TestUser');
    expect(component.role).toBe('Customer');
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should redirect if transportMode missing', () => {

    sessionStorage.removeItem('transportMode');

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should calculate distance', () => {

    component.calculateDistance(1, 2);

    expect(apiSpy.distance).toHaveBeenCalledWith(1, 2);
  });

  it('should navigate to seat layout', () => {

    component.goToSeatLayout(1, 2);

    expect(routerSpy.navigate)
      .toHaveBeenCalledWith(['/bookingseatlayout', 1, 2]);
  });

  it('should navigate to login', () => {

    component.goToLogin();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should go back to dashboard', () => {

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should call calculateDistance when stopIds exist', () => {

    sessionStorage.setItem('fromStopId', '1');
    sessionStorage.setItem('toStopId', '2');

    const spy = spyOn(component, 'calculateDistance');

    component.ngOnInit();

    expect(spy).toHaveBeenCalledWith(1, 2);
  });

  it('should trigger search when search parameters exist', () => {

  sessionStorage.clear();

  sessionStorage.setItem('transportMode', 'Bus');
  sessionStorage.setItem('fromStopId', '1');
  sessionStorage.setItem('toStopId', '2');
  sessionStorage.setItem('departureDate', '2026-03-10');
  sessionStorage.setItem('fromPlace', 'Hyderabad');
  sessionStorage.setItem('toPlace', 'Bangalore');

  fixture = TestBed.createComponent(Search);
  component = fixture.componentInstance;

  (component as any).map = {
    invalidateSize: jasmine.createSpy('invalidateSize')
  };

  component.ngOnInit();

  expect(component.search).toBeFalse();

  expect(facadeSpy.searchVehicleInstances)
    .toHaveBeenCalledWith(1, 2, '2026-03-10');

  expect(component.searchedFrom).toBe('Hyderabad');
  expect(component.searchedTo).toBe('Bangalore');
  expect(component.searchedDate).toBe('2026-03-10');

});
  it('should return false when instance date/time missing', () => {

    const result = (component as any).isFutureInstance({
      departureDate: null,
      departureTime: null
    });

    expect(result).toBeFalse();
  });

  it('should return true for future instance', () => {

    const futureDate = new Date(Date.now() + 86400000).toISOString();

    const result = (component as any).isFutureInstance({
      departureDate: futureDate,
      departureTime: '10:00'
    });

    expect(result).toBeTrue();
  });

  it('should calculate prices correctly', () => {

    component.distance = 5;

    component.allInstances = [{ minSeatPrice: 100 }];

    (component as any).updatePrices();

    expect(component.allInstances[0].calculatedPrice).toBe(500);
  });

  it('should attach seat prices', () => {

    component.distance = 5;

    component.allInstances = [{ vehicleId: 1 }];

    (component as any).attachSeatPrices();

    expect(apiSpy.getSeatLayoutByVehicleId)
      .toHaveBeenCalledWith(1);

    expect(component.allInstances[0].minSeatPrice).toBe(100);
  });

  it('should fetch vehicle rating from API', () => {

    component.allInstances = [{ vehicleId: 1 }];

    apiSpy.getAverageRating.and.returnValue(of({ data: 5 }));

    (component as any).attachVehicleRatings();

    expect(component.allInstances[0].avgRating).toBe('5.00');
  });

  it('should handle rating API error', () => {

    component.allInstances = [{ vehicleId: 1 }];

    apiSpy.getAverageRating.and.returnValue(
      throwError(() => new Error('API error'))
    );

    (component as any).attachVehicleRatings();

    expect(component.allInstances[0].avgRating).toBe(0);
  });
it('should include instance when vehicle transport mode matches component transportMode', () => {

  component.transportMode = 'Bus';

  const futureDate = new Date(Date.now() + 86400000).toISOString();

  const instances = [
    {
      vehicle: { modeOfTransport: 'Bus' },
      vehicleId: 1,
      isActive: true,
      departureDate: futureDate,
      departureTime: '10:00'
    }
  ];

  spyOn(component as any, 'isFutureInstance').and.returnValue(true);

  (component as any).prepareInstances(instances);

  expect(component.allInstances.length).toBe(1);

});
it('should filter out instance when vehicle transport mode does not match', () => {

  component.transportMode = 'Bus';

  const futureDate = new Date(Date.now() + 86400000).toISOString();

  const instances = [
    {
      vehicle: { modeOfTransport: 'Train' },
      vehicleId: 2,
      isActive: true,
      departureDate: futureDate,
      departureTime: '10:00'
    }
  ];

  spyOn(component as any, 'isFutureInstance').and.returnValue(true);

  (component as any).prepareInstances(instances);

  expect(component.allInstances.length).toBe(0);

});it('should ignore instance when vehicle is undefined', () => {

  component.transportMode = 'Bus';

  const futureDate = new Date(Date.now() + 86400000).toISOString();

  const instances = [
    {
      vehicle: undefined,
      vehicleId: 3,
      isActive: true,
      departureDate: futureDate,
      departureTime: '10:00'
    }
  ];

  spyOn(component as any, 'isFutureInstance').and.returnValue(true);

  (component as any).prepareInstances(instances);

  expect(component.allInstances.length).toBe(0);

});it('should use cached vehicle rating instead of calling API', () => {

  component.allInstances = [
    { vehicleId: 1 },
    { vehicleId: 1 }
  ];

  // put rating in cache
  (component as any).vehicleRatingCache.set(1, 4);

  const applySpy = spyOn(component as any, 'applyRatingToInstances');

  (component as any).attachVehicleRatings();

  expect(apiSpy.getAverageRating).not.toHaveBeenCalled();

  expect(applySpy).toHaveBeenCalledWith(1, 4);

});it('should apply cached rating to all instances', () => {

  component.allInstances = [
    { vehicleId: 1 },
    { vehicleId: 1 }
  ];

  (component as any).vehicleRatingCache.set(1, 5);

  (component as any).attachVehicleRatings();

  expect(component.allInstances[0].avgRating).toBe(5);
  expect(component.allInstances[1].avgRating).toBe(5);

});
it('should show price range error when minPrice > maxPrice', () => {

  component.minPrice = 500;
  component.maxPrice = 100;

  component.applyFilters();

  expect(component.priceRangeError).toBeTrue();

});
it('should filter instances by price', () => {

  component.allInstances = [
    { calculatedPrice: 200, availableSeats: 10 },
    { calculatedPrice: 500, availableSeats: 10 }
  ];

  component.minPrice = 300;

  component.applyFilters();

  expect(component.filteredInstances.length).toBe(1);

});
it('should filter instances by seat count', () => {

  component.allInstances = [
    { calculatedPrice: 200, availableSeats: 2 },
    { calculatedPrice: 200, availableSeats: 10 }
  ];

  component.minSeats = 5;

  component.applyFilters();

  expect(component.filteredInstances.length).toBe(1);

});
it('should filter instances by date', () => {

  component.allInstances = [
    { departureDate: '2026-03-10T10:00', availableSeats: 10 },
    { departureDate: '2026-03-11T10:00', availableSeats: 10 }
  ];

  component.filterDate = '2026-03-10';

  component.applyFilters();

  expect(component.filteredInstances.length).toBe(1);

});
it('should filter train seat type', () => {

  component.transportMode = 'Train';

  component.allInstances = [
    {
      availableSeats: 10,
      seatMeta: [{ type: 'SLEEPER' }]
    }
  ];

  component.seatType = 'SLEEPER';

  component.applyFilters();

  expect(component.filteredInstances.length).toBe(1);

});
it('should filter by seat deck and position', () => {

  component.transportMode = 'Bus';

  component.allInstances = [
    {
      availableSeats: 10,
      seatMeta: [
        { type: 'SEATER', deck: 'LOWER', position: 'WINDOW' }
      ]
    }
  ];

  component.seatType = 'SEATER';
  component.seatDeck = 'LOWER';
  component.seatPosition = 'WINDOW';

  component.applyFilters();

  expect(component.filteredInstances.length).toBe(1);

});
it('should reset filters', () => {

  component.filterDate = '2026-01-01';
  component.minPrice = 200;
  component.maxPrice = 300;
  component.minSeats = 5;

  component.allInstances = [{}, {}];

  component.resetFilters();

  expect(component.minPrice).toBe(0);
  expect(component.maxPrice).toBe(10000);
  expect(component.filteredInstances.length).toBe(2);

});
it('should sort results by price', () => {

  component.sortBy = 'price';

  component.filteredInstances = [
    { calculatedPrice: 500 },
    { calculatedPrice: 100 }
  ];

  (component as any).sortResults();

  expect(component.filteredInstances[0].calculatedPrice).toBe(100);

});
it('should sort results by departure time', () => {

  component.sortBy = 'departure';

  component.filteredInstances = [
    {
      departureDate: '2026-03-12',
      departureTime: '10:00'
    },
    {
      departureDate: '2026-03-10',
      departureTime: '10:00'
    }
  ];

  (component as any).sortResults();

  expect(component.filteredInstances[0].departureDate).toBe('2026-03-10');

});
it('should show error when locations missing', () => {

  component.fromLocationName = '';
  component.toLocationName = '';
  component.departureDateFilter = '';

  component.searchByLocations();

  expect(toastrSpy.error)
    .toHaveBeenCalledWith('Please select From, To and Date');

});
it('should search vehicles by locations', () => {

  component.stops = [
    { stopId: 1, stopName: 'A' },
    { stopId: 2, stopName: 'B' }
  ];

  component.fromLocationName = 'A';
  component.toLocationName = 'B';
  component.departureDateFilter = '2026-03-10';

  spyOn(component, 'calculateDistance');

  component.searchByLocations();

  expect(facadeSpy.searchVehicleInstances)
    .toHaveBeenCalledWith(1, 2, '2026-03-10');

});
it('should load vehicle reviews', () => {

  apiSpy.getReviewsByVehicle.and.returnValue(
    of({ data: [{ rating: 5 }] })
  );

  const instance = {
    instanceId: 1,
    vehicleId: 1,
    vehicle: { vehicleCode: 'BUS123' }
  };

  component.openReviews(instance);

  expect(component.selectedVehicleReviews.length).toBe(1);

});
it('should handle review API error', () => {

  apiSpy.getReviewsByVehicle.and.returnValue(
    throwError(() => new Error())
  );

  const instance = {
    instanceId: 1,
    vehicleId: 1,
    vehicle: { vehicleCode: 'BUS123' }
  };

  component.openReviews(instance);

  expect(toastrSpy.error)
    .toHaveBeenCalledWith('Unable to load reviews');

});
});
