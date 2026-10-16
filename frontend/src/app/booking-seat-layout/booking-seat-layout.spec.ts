import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingSeatLayout } from './booking-seat-layout';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { of, throwError } from 'rxjs';
describe('BookingSeatLayout', () => {

  let component: BookingSeatLayout;
  let fixture: ComponentFixture<BookingSeatLayout>;

  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;
beforeEach(async () => {

  toastrSpy = jasmine.createSpyObj('ToastrService', ['error', 'warning']);

  apiSpy = jasmine.createSpyObj('Api_Calls', [
    'distance',
    'getSeatLayoutByVehicleId',
    'getBookingsByInstanceId',
    'getPassengers'
  ]);

  await TestBed.configureTestingModule({
    imports: [BookingSeatLayout],
    providers: [
      { provide: ToastrService, useValue: toastrSpy },
      { provide: Api_Calls, useValue: apiSpy },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: (key: string) => {
                if (key === 'vehicleId') return '1';
                if (key === 'instanceId') return '2';
                return null;
              }
            }
          }
        }
      }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(BookingSeatLayout);
  component = fixture.componentInstance;

  /* FIX: mock Leaflet map so invalidateSize never crashes */
  (component as any).map = {
    invalidateSize: jasmine.createSpy('invalidateSize')
  };

});

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize route params', () => {

    apiSpy.distance.and.returnValue(
      of({ status: true, data: 1 })
    );

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: '{"seats":[]}' } })
    );

    apiSpy.getBookingsByInstanceId.and.returnValue(
      of({ status: true, data: [] })
    );

    component.ngOnInit();

    expect(component.vehicleId).toBe(1);
    expect(component.instanceId).toBe(2);
  });
  /* ---------------- DISTANCE ---------------- */



  /* ---------------- BOOKINGS ---------------- */

  it('should load bookings and passengers', () => {
    apiSpy.getBookingsByInstanceId.and.returnValue(of({
      status: true,
      data: [{ bookingId: 10 }]
    }));

    apiSpy.getPassengers.and.returnValue(of({
      status: true,
      data: [{ seatNumber: 'A1', gender: 'male' }]
    }));

    component.loadBookings();

    expect(component.bookedSeatMap['A1']).toBe('Male');
  });

  /* ---------------- SEAT LAYOUT ---------------- */

  it('should load seat layout', () => {

    const layout = {
      seats: [
        { seatNo: 'A1', row: 1, column: 1, type: 'SEATER', deck: 'LOWER', position: 'WINDOW', BasePrice: 100 }
      ]
    };

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: JSON.stringify(layout) } })
    );

    component.fetchSeatLayout();

    expect(component.seats.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should select a train coach', () => {
    const coach = { type: 'AC', BasePrice: 100 };

    component.selectCoach(coach);

    expect(component.selectedCoach).toEqual(coach);
  });

  it('should handle layout error', () => {

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      throwError(() => new Error())
    );

    component.fetchSeatLayout();

    expect(component.errorMsg).toBe('Failed to load seat layout');
  });

  /* ---------------- SEAT SELECTION ---------------- */

  it('should select seat', () => {

    const seat: any = { seatNo: 'A1', row: 1, column: 1, type: 'SEATER', deck: 'LOWER', position: 'WINDOW', BasePrice: 100 };

    component.toggleSeat(seat);

    expect(component.selectedSeats.length).toBe(1);
  });

  it('should deselect seat', () => {

    const seat: any = { seatNo: 'A1', row: 1, column: 1, type: 'SEATER', deck: 'LOWER', position: 'WINDOW', BasePrice: 100 };

    component.selectedSeats = [seat];

    component.toggleSeat(seat);

    expect(component.selectedSeats.length).toBe(0);
  });

  it('should prevent selecting booked seat', () => {

    const seat: any = { seatNo: 'A1', row: 1, column: 1, type: 'SEATER', deck: 'LOWER', position: 'WINDOW', BasePrice: 100 };

    component.bookedSeatMap['A1'] = 'Male';

    component.toggleSeat(seat);

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should enforce max seat limit', () => {

    component.selectedSeats = new Array(6).fill({
      seatNo: 'X', BasePrice: 100
    });

    const seat: any = { seatNo: 'A1', row: 1, column: 1, type: 'SEATER', deck: 'LOWER', position: 'WINDOW', BasePrice: 100 };

    component.toggleSeat(seat);

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  /* ---------------- PRICE ---------------- */

it('should calculate total price', () => {

  component.distance = 1;   // FIX

  component.selectedSeats = [
    { seatNo: 'A1', BasePrice: 100 },
    { seatNo: 'A2', BasePrice: 200 }
  ] as any;

  expect(component.totalPrice).toBe(300);
});

  /* ---------------- SELECTED SEATS ---------------- */

  it('should return selected seat numbers', () => {

    component.selectedSeats = [
      { seatNo: 'A1' },
      { seatNo: 'A2' }
    ] as any;

    expect(component.selectedSeatNumbers).toBe('A1, A2');
  });

  it('should return None when no seats are selected', () => {
    component.selectedSeats = [];

    expect(component.selectedSeatNumbers).toBe('None');
  });

  /* ---------------- PASSENGER FORM ---------------- */

  it('should show passenger form when seats selected', () => {

    component.selectedSeats = [{ seatNo: 'A1' }] as any;

    component.proceed();

    expect(component.showPassengerForm).toBeTrue();
  });

  it('should require coach selection before proceeding for train', () => {
    component.layout = { transportMode: 'TRAIN' };
    component.selectedCoach = null;

    component.proceed();

    expect(toastrSpy.error).toHaveBeenCalledWith('Please select a coach type');
    expect(component.showPassengerForm).toBeFalse();
  });

  it('should validate train passenger count before proceeding', () => {
    component.layout = { transportMode: 'TRAIN' };
    component.selectedCoach = { type: 'AC', BasePrice: 100 };
    component.trainPassengerCount = 7;

    component.proceed();

    expect(toastrSpy.error).toHaveBeenCalledWith('Passengers must be between 1 and 6');
  });

  it('should generate selected train seats and show passenger form', () => {
    component.layout = { transportMode: 'TRAIN' };
    component.selectedCoach = { type: 'AC', BasePrice: 100 };
    component.trainPassengerCount = 2;
    component.distance = 3;

    component.proceed();

    expect(component.selectedSeats.length).toBe(2);
    expect(component.selectedSeats[0].seatNo).toBe('AC-1');
    expect(component.selectedSeats[0].price).toBe(300);
    expect(component.showPassengerForm).toBeTrue();
  });

  it('should alert when no seats selected', () => {

    spyOn(window, 'alert');

    component.proceed();

    expect(window.alert).toHaveBeenCalled();
  });

  /* ---------------- GRID ---------------- */

  it('should return row array', () => {

    component.layout = { rows: 3 };

    expect(component.rowArray).toEqual([1, 2, 3]);
  });

  it('should return column array', () => {

    component.layout = { columns: 2 };

    expect(component.colArray).toEqual([1, 2]);
  });

  it('should return grid columns with aisle', () => {

    component.layout = { columns: 4, aisleColumn: 2 };

    expect(component.getGridColumns()).toBe(5);
  });

  it('should return 0 rows when layout rows are missing', () => {
    component.layout = {};

    expect(component.rowArray).toEqual([]);
  });

  it('should return 0 columns when layout columns are missing', () => {
    component.layout = {};

    expect(component.colArray).toEqual([]);
  });

  it('should return grid columns for flight with aisle columns', () => {
    component.layout = { transportMode: 'FLIGHT', columns: 6 };
    component.aisleColumns = [2, 4];

    expect(component.getGridColumns()).toBe(8);
  });

  it('should return 0 grid columns when layout columns are missing', () => {
    component.layout = {};

    expect(component.getGridColumns()).toBe(0);
  });

  it('should shift grid position for flight aisles', () => {
    component.layout = { transportMode: 'FLIGHT', columns: 6 };
    component.aisleColumns = [2, 4];

    expect(component.getGridPosition(5)).toBe(7);
  });

  it('should shift grid position when column is after aisleColumn', () => {
    component.layout = { aisleColumn: 2 };

    expect(component.getGridPosition(3)).toBe(4);
  });

  it('should return same grid position when column is before aisle', () => {
    component.layout = { aisleColumn: 3 };

    expect(component.getGridPosition(2)).toBe(2);
  });

  /* ---------------- GETTERS ---------------- */

  it('should get lower deck seats', () => {

    component.seats = [
      { seatNo: 'A1', deck: 'LOWER' },
      { seatNo: 'A2', deck: 'UPPER' }
    ] as any;

    expect(component.lowerDeckSeats.length).toBe(1);
  });

  it('should get upper deck seats', () => {

    component.seats = [
      { seatNo: 'A1', deck: 'LOWER' },
      { seatNo: 'A2', deck: 'UPPER' }
    ] as any;

    expect(component.upperDeckSeats.length).toBe(1);
  });

  /* ---------------- BOOKING HELPERS ---------------- */

  it('should check if seat is booked', () => {

    component.bookedSeatMap['A1'] = 'Male';

    const seat: any = { seatNo: 'A1' };

    expect(component.isBooked(seat)).toBeTrue();
  });

  it('should get booked gender', () => {

    component.bookedSeatMap['A1'] = 'Female';

    const seat: any = { seatNo: 'A1' };

    expect(component.getBookedGender(seat)).toBe('Female');
  });

  it('should return null booked gender for unbooked seat', () => {
    expect(component.getBookedGender({ seatNo: 'Z9' } as any)).toBeNull();
  });

  /* ---------------- SEAT CLASS ---------------- */

  it('should return seat class object', () => {

    const seat: any = {
      type: 'SEATER',
      position: 'WINDOW',
      deck: 'UPPER'
    };

    const result = component.seatClass(seat);

    expect(result.seater).toBeTrue();
    expect(result.window).toBeTrue();
  });


  describe('BookingSeatLayout branch coverage', () => {


   
    /* ---------------- FEMALE PASSENGER ---------------- */

    it('should map female passenger seat', () => {

      apiSpy.getBookingsByInstanceId.and.returnValue(of({
        status: true,
        data: [{ bookingId: 1 }]
      }));

      apiSpy.getPassengers.and.returnValue(of({
        status: true,
        data: [{ seatNumber: 'A1', gender: 'female' }]
      }));

      component.loadBookings();

      expect(component.bookedSeatMap['A1']).toBe('Female');
    });

    /* ---------------- PASSENGER ERROR ---------------- */

    it('should handle passenger API error', () => {

      spyOn(console, 'error');

      apiSpy.getBookingsByInstanceId.and.returnValue(of({
        status: true,
        data: [{ bookingId: 1 }]
      }));

      apiSpy.getPassengers.and.returnValue(
        throwError(() => new Error('error'))
      );

      component.loadBookings();

      expect(console.error).toHaveBeenCalled();
    });

    /* ---------------- BOOKING ERROR ---------------- */

    it('should handle booking API error', () => {

      spyOn(console, 'error');

      apiSpy.getBookingsByInstanceId.and.returnValue(
        throwError(() => new Error())
      );

      component.loadBookings();

      expect(console.error).toHaveBeenCalled();
    });

    /* ---------------- LAYOUT MISSING ---------------- */

    it('should handle missing layout JSON', () => {

      apiSpy.getSeatLayoutByVehicleId.and.returnValue(
        of({ status: true, data: {} })
      );

      component.fetchSeatLayout();

      expect(component.errorMsg).toBe('Seat layout not available');
    });

    it('should load train seat layout', () => {
      apiSpy.getSeatLayoutByVehicleId.and.returnValue(
        of({
          data: {
            layoutJSON: JSON.stringify({
              transportMode: 'TRAIN',
              trainSeats: [{ coach: 'A1' }]
            })
          }
        })
      );

      component.fetchSeatLayout();

      expect(component.trainSeats).toEqual([{ coach: 'A1' }]);
      expect(component.seats).toEqual([]);
    });

    it('should load flight seat layout with aisle columns', () => {
      apiSpy.getSeatLayoutByVehicleId.and.returnValue(
        of({
          data: {
            layoutJSON: JSON.stringify({
              transportMode: 'FLIGHT',
              seats: [{ seatNo: 'F1' }],
              aisleColumns: [2]
            })
          }
        })
      );

      component.fetchSeatLayout();

      expect(component.seats).toEqual([{ seatNo: 'F1' } as any]);
      expect(component.aisleColumns).toEqual([2]);
    });

    /* ---------------- LAYOUT PARSE ERROR ---------------- */

    it('should handle layout JSON parse error', () => {

      apiSpy.getSeatLayoutByVehicleId.and.returnValue(
        of({ status: true, data: { layoutJSON: 'invalid json' } })
      );

      component.fetchSeatLayout();

      expect(component.errorMsg).toBe('Seat layout not available');
    });

    /* ---------------- ADJACENT GENDER CONFIRM ---------------- */

    it('should cancel seat selection if confirm false', () => {

      spyOn(window, 'confirm').and.returnValue(false);

      const seat: any = {
        seatNo: 'A2',
        row: 1,
        column: 2,
        deck: 'LOWER',
        type: 'SEATER',
        position: 'WINDOW',
        BasePrice: 100
      };

      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER', type: 'SEATER', position: 'WINDOW', BasePrice: 100 }
      ] as any;

      component.bookedSeatMap['A1'] = 'Male';

      component.toggleSeat(seat);

      expect(component.selectedSeats.length).toBe(0);
    });

    /* ---------------- SEAT CLASSES ---------------- */

    it('should return correct seat classes', () => {

      const seat: any = {
        seatNo: 'A1',
        type: 'SEATER',
        deck: 'UPPER',
        position: 'WINDOW'
      };

      component.bookedSeatMap['A1'] = 'Male';

      const result = component.getSeatClasses(seat);

      expect(result.seater).toBeTrue();
      expect(result.window).toBeTrue();
    });

    /* ---------------- GRID COLUMNS ---------------- */

    it('should return columns without aisle', () => {

      component.layout = { columns: 4 };

      expect(component.getGridColumns()).toBe(4);
    });

    it('should return columns with aisle', () => {

      component.layout = { columns: 4, aisleColumn: 2 };

      expect(component.getGridColumns()).toBe(5);
    });

    /* ---------------- GET SEAT ---------------- */

    it('should find seat by row and column', () => {

      const seats = [{ row: 1, column: 1, seatNo: 'A1' }];

      const result = component.getSeat(seats, 1, 1);

      expect(result?.seatNo).toBe('A1');
    });

    it('should return null if seat not found', () => {

      const seats = [{ row: 1, column: 1, seatNo: 'A1' }];

      const result = component.getSeat(seats, 2, 2);

      expect(result).toBeNull();
    });

    /* ---------------- FLIGHT MODE ---------------- */

    it('should detect flight transport mode', () => {

      component.layout = { transportMode: 'FLIGHT' };

      expect(component.isFlight).toBeTrue();
    });

    /* ---------------- AISLE COLUMN ---------------- */

    it('should return aisle column', () => {

      component.layout = { aisleColumn: 3 };

      expect(component.aisleColumn).toBe(3);
    });

    /* ---------------- ADJACENT SEAT WITHOUT AISLE ---------------- */

    it('should return adjacent seat when no aisle', () => {

      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' },
        { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER' }
      ] as any;

      const result = (component as any).getAdjacentSeat({
        seatNo: 'A1', row: 1, column: 1, deck: 'LOWER'
      });

      expect(result?.seatNo).toBe('A2');
    });

    /* ---------------- ADJACENT SEAT ACROSS AISLE ---------------- */

    it('should ignore seat across aisle', () => {

      component.layout = { aisleColumn: 1 };

      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' },
        { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER' }
      ] as any;

      const result = (component as any).getAdjacentSeat({
        seatNo: 'A1', row: 1, column: 1, deck: 'LOWER'
      });

      expect(result).toBeNull();
    });

    /* ---------------- ADJACENT BOOKED GENDER ---------------- */

    it('should return adjacent booked gender', () => {

      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' },
        { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER' }
      ] as any;

      component.bookedSeatMap['A2'] = 'Female';

      const result = (component as any).getAdjacentBookedGender({
        seatNo: 'A1', row: 1, column: 1, deck: 'LOWER'
      });

      expect(result).toBe('Female');
    });

    it('should return null when adjacent seat is not booked', () => {
      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' },
        { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER' }
      ] as any;

      const result = (component as any).getAdjacentBookedGender({
        seatNo: 'A1', row: 1, column: 1, deck: 'LOWER'
      });

      expect(result).toBeNull();
    });

    it('should return null when no adjacent seat exists', () => {
      component.seats = [
        { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' }
      ] as any;

      const result = (component as any).getAdjacentSeat({
        seatNo: 'A1', row: 1, column: 1, deck: 'LOWER'
      });

      expect(result).toBeNull();
    });

    it('should detect train mode', () => {
      component.layout = { transportMode: 'TRAIN' };

      expect(component.isTrain).toBeTrue();
    });

  });
  it('should ignore passenger if seatNumber or gender missing', () => {

    apiSpy.getBookingsByInstanceId.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1 }]
    }));

    apiSpy.getPassengers.and.returnValue(of({
      status: true,
      data: [{ seatNumber: null, gender: null }]
    }));

    component.loadBookings();

    expect(Object.keys(component.bookedSeatMap).length).toBe(0);
  }); it('should apply restrictedGender when adjacent seat booked and confirmed', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    component.seats = [
      { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER', type: 'SEATER', position: 'WINDOW', BasePrice: 100 },
      { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER', type: 'SEATER', position: 'WINDOW', BasePrice: 100 }
    ] as any;

    component.bookedSeatMap['A1'] = 'Male';

    const seat: any = component.seats[1];

    component.toggleSeat(seat);

    expect(seat.restrictedGender).toBe('Male');
  }); it('should return adjacent seat', () => {

    component.seats = [
      { seatNo: 'A1', row: 1, column: 1, deck: 'LOWER' },
      { seatNo: 'A2', row: 1, column: 2, deck: 'LOWER' }
    ] as any;

    const result = (component as any).getAdjacentSeat({
      seatNo: 'A1',
      row: 1,
      column: 1,
      deck: 'LOWER'
    });

    expect(result.seatNo).toBe('A2');
  }); it('should return adjacent seat when aisle exists but seats are on same side', () => {

    component.layout = {
      aisleColumn: 3
    };

    component.seats = [
      {
        seatNo: 'A1',
        row: 1,
        column: 1,
        deck: 'LOWER',
        type: 'SEATER',
        position: 'WINDOW',
        BasePrice: 100
      },
      {
        seatNo: 'A2',
        row: 1,
        column: 2,
        deck: 'LOWER',
        type: 'SEATER',
        position: 'WINDOW',
        BasePrice: 100
      }
    ] as any;

    const seat = component.seats[0];

    const result = (component as any).getAdjacentSeat(seat);

    expect(result).toEqual(component.seats[1]);
  });

  it('should handle bookings response without data', () => {
    apiSpy.getBookingsByInstanceId.and.returnValue(of({} as any));

    component.loadBookings();

    expect(component.bookedSeatMap).toEqual({});
  });

  it('should handle passengers response without data', () => {
    apiSpy.getBookingsByInstanceId.and.returnValue(of({
      status: true,
      data: [{ bookingId: 1 }]
    }));
    apiSpy.getPassengers.and.returnValue(of({} as any));

    component.loadBookings();

    expect(component.bookedSeatMap).toEqual({});
  });

  it('should calculate total price for train coach selection', () => {
    component.layout = { transportMode: 'TRAIN' };
    component.selectedCoach = { BasePrice: 120 };
    component.distance = 2;
    component.trainPassengerCount = 3;

    expect(component.totalPrice).toBe(720);
  });

});
