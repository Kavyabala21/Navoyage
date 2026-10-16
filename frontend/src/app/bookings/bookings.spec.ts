import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Bookings } from './bookings';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Bookings Component', () => {

  let component: Bookings;
  let fixture: ComponentFixture<Bookings>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getMyBookings',
      'getMyReviews',
      'getPassengers',
      'getVehicleInstanceById',
      'cancelBooking',
      'cancelPassenger',
      'deleteReview'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Bookings],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Bookings);
    component = fixture.componentInstance;

    apiSpy.getMyBookings.and.returnValue(of({ status: true, data: [] }));
    apiSpy.getMyReviews.and.returnValue(of({ status: true, data: [] }));
    apiSpy.getPassengers.and.returnValue(of({ status: true, data: [] }));
    apiSpy.getVehicleInstanceById.and.returnValue(of({ status: true, data: {} as any }));
    apiSpy.cancelBooking.and.returnValue(of({ status: true, data: null }));
    apiSpy.cancelPassenger.and.returnValue(of({ status: true, data: null }));
    apiSpy.deleteReview.and.returnValue(of({ status: true, data: null }));

  });

  /* INIT */

  it('should call loadBookings on init', () => {
    spyOn(component, 'loadBookings');
    component.ngOnInit();
    expect(component.loadBookings).toHaveBeenCalled();
  });

  /* LOAD BOOKINGS */

  it('should load bookings successfully', () => {

    apiSpy.getMyBookings.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1, instanceId: 1 }]
    }));

    component.loadBookings();

    expect(component.bookings.length).toBe(1);
  });

  it('should handle empty bookings', () => {

    apiSpy.getMyBookings.and.returnValue(of({
      status: true,
      data: []
    }));

    component.loadBookings();

    expect(component.bookings.length).toBe(0);
  });

  it('should handle bookings response without data', () => {
    apiSpy.getMyBookings.and.returnValue(of({ status: true } as any));

    component.loadBookings();

    expect(component.bookings).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('should handle booking API error', () => {

    apiSpy.getMyBookings.and.returnValue(
      throwError(() => new Error())
    );

    component.loadBookings();

    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load bookings');
  });

  /* PASSENGERS */

  it('should load passengers successfully', () => {

    apiSpy.getMyBookings.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1, instanceId: 1 }]
    }));

    apiSpy.getMyReviews.and.returnValue(of({
      status: true,
      data: []
    }));

    apiSpy.getPassengers.and.returnValue(of({
      status: true,
      data: [{ passengerId: 1 }]
    }));

    component.loadBookings();

    expect(component.bookings[0].passengers.length).toBe(1);
  });

  it('should handle passengers response without data', () => {
    apiSpy.getMyBookings.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1, instanceId: 1 }]
    }));

    apiSpy.getMyReviews.and.returnValue(of({
      status: true,
      data: []
    }));

    apiSpy.getPassengers.and.returnValue(of({ status: true } as any));

    component.loadBookings();

    expect(component.bookings[0].passengers).toEqual([]);
    expect(component.bookings[0].passengersLoading).toBeFalse();
  });

  it('should handle passenger loading error', () => {

    apiSpy.getMyBookings.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1, instanceId: 1 }]
    }));

    apiSpy.getMyReviews.and.returnValue(of({
      status: true,
      data: []
    }));

    apiSpy.getPassengers.and.returnValue(
      throwError(() => new Error())
    );

    component.loadBookings();

    expect(component.bookings[0].passengersLoading).toBeFalse();
  });

  /* RETURN PATH COVERAGE */

  it('should return if booking has no passengers in toggleSelectAll', () => {

    const booking: any = { passengers: [] };

    component.toggleSelectAll(booking, { target: { checked: true } });

    expect(booking.passengers.length).toBe(0);
  });

  it('should return false if passengers missing', () => {

    const booking: any = {};

    const result = component.hasSelectedPassengers(booking);

    expect(result).toBeFalse();
  });

  it('should return when cancelSelectedPassengers has no passengers', () => {

    const booking: any = { passengers: [] };

    component.cancelSelectedPassengers(booking);

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should return when vehicleInstance missing', () => {

    component.goToReview({ bookingId: 1 });

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should return false if booking undefined', () => {

    const result = component.canCancelBooking(undefined as any);

    expect(result).toBeFalse();
  });

  /* CANCEL BOOKING */

  it('should cancel booking', () => {

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'loadBookings');

    component.cancelBooking(1);

    expect(apiSpy.cancelBooking).toHaveBeenCalledWith(1);
  });

  it('should not cancel booking if confirm false', () => {

    spyOn(window, 'confirm').and.returnValue(false);

    component.cancelBooking(1);

    expect(apiSpy.cancelBooking).not.toHaveBeenCalled();
  });

  /* DELETE REVIEW */

  it('should delete review', () => {

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'loadBookings');

    component.deleteReview(1);

    expect(apiSpy.deleteReview).toHaveBeenCalled();
  });

  it('should show error if delete review fails', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    apiSpy.deleteReview.and.returnValue(
      throwError(() => new Error())
    );

    component.deleteReview(1);

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  /* NAVIGATION */

  it('should navigate to dashboard', () => {

    component.gotohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
  it('should return false when instance has missing date or time', () => {

    const result = (component as any).hasTripStartedOrCompleted({});

    expect(result).toBeFalse();

  });
  it('should calculate tripStarted when vehicle instance has departure date and time', () => {

    const inst = {
      departureDate: '2026-03-09T00:00:00',
      departureTime: '10:30:00'
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeDefined();
  });
  it('should return false when departureDate or departureTime is missing', () => {

    const inst = {
      departureDate: null,
      departureTime: null
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeFalse();
  });
  it('should return true when current IST time is after departure', () => {

    const inst = {
      departureDate: '2020-01-01T00:00:00',
      departureTime: '00:00:00'
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeTrue();
  });
  it('should return true when current IST time is after departure', () => {

    const inst = {
      departureDate: '2020-01-01T00:00:00',
      departureTime: '00:00:00'
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeTrue();
  });
  it('should return false when trip has not started yet', () => {

    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);

    const inst = {
      departureDate: future.toISOString(),
      departureTime: '23:59:00'
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeFalse();
  });

  it('should treat missing time minutes and seconds as zero', () => {
    const inst = {
      departureDate: '2020-01-01T00:00:00',
      departureTime: '00'
    };

    const result = (component as any).hasTripStartedOrCompleted(inst);

    expect(result).toBeTrue();
  });
  it('should navigate to reviews page with booking and vehicle id', () => {


    const booking = {
      bookingId: 10,
      vehicleInstance: {
        vehicleId: 5
      }
    };

    component.goToReview(booking);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reviews'], {
      queryParams: {
        bookingId: 10,
        vehicleId: 5
      }
    });
  });
  it('should show error if booking or vehicle id missing', () => {
    const booking = {
      bookingId: null,
      vehicleInstance: null
    };

    component.goToReview(booking);

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Unable to open review. Missing booking or vehicle.'
    );
  });
  it('should show error message when cancelBooking API fails', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    const errorResponse = {
      error: { message: 'Cancellation failed from API' }
    };

    apiSpy.cancelBooking.and.returnValue(
      throwError(() => errorResponse)
    );

    component.cancelBooking(10);

    expect(toastrSpy.error).toHaveBeenCalledWith('Cancellation failed from API');
  });
  it('should show default cancellation failed message when API error has no message', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    apiSpy.cancelBooking.and.returnValue(
      throwError(() => ({}))
    );

    component.cancelBooking(10);

    expect(toastrSpy.error).toHaveBeenCalledWith('Cancellation failed');
  });
  it('should select confirmed passengers in toggleSelectAll', () => {

  const booking: any = {
    passengers: [
      { status: 'Confirmed', selected: false },
      { status: 'Cancelled', selected: false }
    ]
  };

  component.toggleSelectAll(booking, { target: { checked: true } });

  expect(booking.passengers[0].selected).toBeTrue();
  expect(booking.passengers[1].selected).toBeFalse();
});it('should unselect confirmed passengers when checkbox unchecked', () => {

  const booking: any = {
    passengers: [
      { status: 'Confirmed', selected: true }
    ]
  };

  component.toggleSelectAll(booking, { target: { checked: false } });

  expect(booking.passengers[0].selected).toBeFalse();
});it('should return true if at least one passenger is selected', () => {

  const booking: any = {
    passengers: [
      { selected: false },
      { selected: true }
    ]
  };

  const result = component.hasSelectedPassengers(booking);

  expect(result).toBeTrue();
});it('should return false when no passengers are selected', () => {

  const booking: any = {
    passengers: [
      { selected: false },
      { selected: false }
    ]
  };

  const result = component.hasSelectedPassengers(booking);

  expect(result).toBeFalse();
});
it('should cancel selected confirmed passengers', () => {

  spyOn(window, 'confirm').and.returnValue(true);
  spyOn(component, 'loadBookings');

  const booking: any = {
    bookingId: 100,
    passengers: [
      { passengerId: 1, selected: true, status: 'Confirmed' },
      { passengerId: 2, selected: false, status: 'Confirmed' },
      { passengerId: 3, selected: true, status: 'Cancelled' }
    ]
  };

  component.cancelSelectedPassengers(booking);

  expect(apiSpy.cancelPassenger).toHaveBeenCalledWith(1);
});
it('should show warning if no confirmed passengers selected', () => {

  const booking: any = {
    passengers: [
      { passengerId: 1, selected: false, status: 'Confirmed' },
      { passengerId: 2, selected: true, status: 'Cancelled' }
    ]
  };

  component.cancelSelectedPassengers(booking);

  expect(toastrSpy.warning).toHaveBeenCalledWith('Please select at least one passenger');
});it('should not cancel passengers if confirm is false', () => {

  spyOn(window, 'confirm').and.returnValue(false);

  const booking: any = {
    bookingId: 101,
    passengers: [
      { passengerId: 1, selected: true, status: 'Confirmed' }
    ]
  };

  component.cancelSelectedPassengers(booking);

  expect(apiSpy.cancelPassenger).not.toHaveBeenCalled();
});it('should cancel selected passengers successfully', () => {

  spyOn(window, 'confirm').and.returnValue(true);
  spyOn(component, 'loadBookings');

  const booking: any = {
    bookingId: 42,
    passengers: [
      { passengerId: 1, selected: true, status: 'Confirmed' },
      { passengerId: 2, selected: true, status: 'Confirmed' }
    ]
  };

  component.cancelSelectedPassengers(booking);

  expect(apiSpy.cancelPassenger).not.toHaveBeenCalled();
  expect(apiSpy.cancelBooking).toHaveBeenCalledWith(42);

  expect(toastrSpy.success).toHaveBeenCalledWith(
    'Booking cancelled successfully. Refund processed.'
  );

  expect(component.loadBookings).toHaveBeenCalled();
});it('should show error when passenger cancellation fails', () => {

  spyOn(window, 'confirm').and.returnValue(true);

  apiSpy.cancelBooking.and.returnValue(
    throwError(() => ({}))
  );

  const booking: any = {
    bookingId: 77,
    passengers: [
      { passengerId: 1, selected: true, status: 'Confirmed' }
    ]
  };

  component.cancelSelectedPassengers(booking);

  expect(toastrSpy.error).toHaveBeenCalledWith('Cancellation failed');
});it('should allow cancel when booking is confirmed and trip not started', () => {

  const booking: any = {
    status: 'Confirmed',
    tripStarted: false
  };

  const result = component.canCancelBooking(booking);

  expect(result).toBeTrue();
});it('should not allow cancel when trip already started', () => {

  const booking: any = {
    status: 'Confirmed',
    tripStarted: true
  };

  const result = component.canCancelBooking(booking);

  expect(result).toBeFalse();
});it('should not allow cancel when booking not confirmed', () => {

  const booking: any = {
    status: 'Cancelled',
    tripStarted: false
  };

  const result = component.canCancelBooking(booking);

  expect(result).toBeFalse();
});it('should allow rating when trip started and not cancelled', () => {

  const booking: any = {
    status: 'Completed',
    tripStarted: true
  };

  const result = component.canRateNow(booking);

  expect(result).toBeTrue();
});it('should not allow rating when booking cancelled', () => {

  const booking: any = {
    status: 'Cancelled',
    tripStarted: true
  };

  const result = component.canRateNow(booking);

  expect(result).toBeFalse();
});it('should not allow rating when trip not started', () => {

  const booking: any = {
    status: 'Confirmed',
    tripStarted: false
  };

  const result = component.canRateNow(booking);

  expect(result).toBeFalse();
});
  it('should not delete review when confirm is false', () => {

  spyOn(window, 'confirm').and.returnValue(false);

  component.deleteReview(1);

  expect(apiSpy.deleteReview).not.toHaveBeenCalled();
});

it('should show error when reviews loading fails', () => {
  apiSpy.getMyBookings.and.returnValue(of({
    status: true,
    data: [{ bookingId: 1, instanceId: 1 }]
  }));
  apiSpy.getMyReviews.and.returnValue(throwError(() => new Error('reviews failed')));

  component.loadBookings();

  expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load reviews');
  expect(component.loading).toBeFalse();
});

it('should handle vehicle instance error by keeping tripStarted false', () => {
  apiSpy.getMyBookings.and.returnValue(of({
    status: true,
    data: [{ bookingId: 1, instanceId: 1 }]
  }));
  apiSpy.getMyReviews.and.returnValue(of({ status: true, data: [] }));
  apiSpy.getVehicleInstanceById.and.returnValue(throwError(() => new Error('instance failed')));

  component.loadBookings();

  expect(component.bookings[0].tripStarted).toBeFalse();
});

it('should filter cancelled bookings', () => {
  component.bookings = [
    { status: 'Confirmed', tripStarted: false },
    { status: 'Cancelled', tripStarted: false }
  ];

  component.setTab('cancelled');

  expect(component.activeTab).toBe('cancelled');
  expect(component.filteredBookings).toEqual([{ status: 'Cancelled', tripStarted: false }]);
});

it('should filter completed bookings', () => {
  component.bookings = [
    { status: 'Confirmed', tripStarted: false },
    { status: 'Confirmed', tripStarted: true },
    { status: 'Cancelled', tripStarted: true }
  ];

  component.setTab('completed');

  expect(component.filteredBookings).toEqual([{ status: 'Confirmed', tripStarted: true }]);
});

it('should filter upcoming bookings by default', () => {
  component.bookings = [
    { status: 'Confirmed', tripStarted: false },
    { status: 'Confirmed', tripStarted: true },
    { status: 'Cancelled', tripStarted: false }
  ];

  component.setTab('upcoming');

  expect(component.filteredBookings).toEqual([{ status: 'Confirmed', tripStarted: false }]);
});

it('should return early from applyFilter when bookings is missing', () => {
  component.bookings = null as any;
  component.filteredBookings = [];

  component.applyFilter();

  expect(component.filteredBookings).toEqual([]);
});

it('should open and close the ticket modal', () => {
  const booking = { pnr: '1234567890', passengers: [{ name: 'A' }] };

  component.openTicketModal(booking);
  expect(component.showTicketModal).toBeTrue();
  expect(component.selectedTicket.pnr).toBe('1234567890');
  expect(component.selectedTicket.passengers.length).toBe(1);

  component.closeTicketModal();
  expect(component.showTicketModal).toBeFalse();
  expect(component.selectedTicket).toBeNull();
});

it('should show error when download ticket is requested before content is ready', () => {
  component.ticketContent = undefined as any;

  component.downloadTicket();

  expect(toastrSpy.error).toHaveBeenCalledWith('Ticket not ready');
});

});
