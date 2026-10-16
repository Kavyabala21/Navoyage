import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatLayout } from './seat-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('SeatLayout Component', () => {

  let component: SeatLayout;
  let fixture: ComponentFixture<SeatLayout>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const routeMock = {
    snapshot: {
      queryParamMap: {
        get: (key: string) => {
          if (key === 'vehicleId') return '10';
          if (key === 'edit') return 'true';
          return null;
        }
      }
    }
  };

  beforeEach(async () => {

    // FIX: block timers from Stop component (Leaflet map)
    spyOn(window as any, 'setTimeout').and.callFake(() => 0);

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getSeatLayoutByVehicleId',
      'getVehicleById',
      'updateSeatLayout',
      'saveSeatLayout'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SeatLayout],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeatLayout);
    component = fixture.componentInstance;

    apiSpy.getVehicleById.and.returnValue(
      of({ data: { capacity: 20 } })
    );

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: JSON.stringify({ rows: 2, columns: 2, seats: [] }) } })
    );

    fixture.detectChanges();
  });

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should read route params', () => {
    expect(component.vehicleId).toBe(10);
    expect(component.isEditMode).toBeTrue();
  });

  /* ---------------- LOAD EXISTING ---------------- */

  it('should load existing layout', () => {

    const layout = {
      rows: 3,
      columns: 4,
      transportMode: 'BUS',
      layoutType: 'BUS_SEATER',
      seats: []
    };

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: { layoutJSON: JSON.stringify(layout) } })
    );

    component.loadExistingLayout();

    expect(component.rows).toBe(3);
    expect(component.columns).toBe(4);
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('should warn if no layout found', () => {

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: {} })
    );

    component.loadExistingLayout();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  /* ---------------- TRANSPORT MODE ---------------- */

  it('should detect flight transport mode', () => {

    sessionStorage.setItem('transportMode', 'Flight');

    component.loadTransportMode();

    expect(component.isFlight).toBeTrue();
    expect(component.transportMode).toBe('FLIGHT');
  });

  it('should detect bus transport mode', () => {

    sessionStorage.setItem('transportMode', 'Bus');

    component.loadTransportMode();

    expect(component.isFlight).toBeFalse();
  });

  /* ---------------- CAPACITY ---------------- */

  it('should load vehicle capacity', () => {

    component.loadVehicleCapacity();

    expect(component.capacity).toBe(20);
  });

  /* ---------------- GRID HELPERS ---------------- */

  it('should get seat by row and column', () => {

    const seats = [{ row: 1, column: 1, seatNo: 'A1' }];

    const result = component.getSeat(seats, 1, 1);

    expect(result?.seatNo).toBe('A1');
  });

  it('should calculate grid columns for bus', () => {

    component.columns = 4;
    component.aisleColumn = 2;

    expect(component.getGridColumns()).toBe(5);
  });

  it('should calculate grid columns for flight', () => {

    component.isFlight = true;
    component.columns = 4;
    component.aisleColumns = [2];

    expect(component.getGridColumns()).toBe(5);
  });

  it('should calculate grid position with aisle', () => {

    component.aisleColumn = 2;

    expect(component.getGridPosition(3)).toBe(4);
  });

  /* ---------------- ARRAYS ---------------- */

  it('should return row array', () => {

    component.rows = 3;

    expect(component.rowArray).toEqual([1, 2, 3]);
  });

  it('should return column array', () => {

    component.columns = 3;

    expect(component.colArray).toEqual([1, 2, 3]);
  });

  /* ---------------- DECK FILTERS ---------------- */

  it('should return lower deck seats', () => {

    component.seats = [
      { deck: 'LOWER' },
      { deck: 'UPPER' }
    ];

    expect(component.lowerDeckSeats.length).toBe(1);
  });

  it('should return upper deck seats', () => {

    component.seats = [
      { deck: 'LOWER' },
      { deck: 'UPPER' }
    ];

    expect(component.upperDeckSeats.length).toBe(1);
  });

  /* ---------------- SEAT LETTER ---------------- */

  it('should return seat letter', () => {

    const letter = component.getSeatLetter(1);

    expect(letter).toBe('A');
  });

  /* ---------------- GENERATE SEATS ---------------- */

  it('should generate bus seats', () => {

    component.capacity = 4;
    component.rows = 2;
    component.columns = 2;
    component.isFlight = false;

    component.generateSeats();

    expect(component.seats.length).toBeGreaterThan(0);
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('should generate flight seats', () => {

    component.capacity = 4;
    component.rows = 2;
    component.columns = 2;
    component.isFlight = true;
    component.aisleInput = '1';

    component.generateSeats();

    expect(component.seats.length).toBeGreaterThan(0);
  });

  /* ---------------- MODAL ---------------- */

  it('should select seat', () => {

    const seat = { seatNo: 'A1' };

    component.selectSeat(seat);

    expect(component.selectedSeat).toBe(seat);
  });

  it('should close seat editor', () => {

    component.selectedSeat = { seatNo: 'A1' };

    component.closeSeatEditor();

    expect(component.selectedSeat).toBeNull();
  });

  /* ---------------- SAVE ---------------- */

  it('should save new layout', () => {

    component.isEditMode = false;
    component.layout = { test: true };

    apiSpy.saveSeatLayout.and.returnValue(of({}));

    component.saveLayout();

    expect(apiSpy.saveSeatLayout).toHaveBeenCalled();
  });

  it('should update layout in edit mode', () => {

    component.isEditMode = true;
    component.layout = { test: true };

    apiSpy.updateSeatLayout.and.returnValue(of({}));

    component.saveLayout();

    expect(apiSpy.updateSeatLayout).toHaveBeenCalled();
  });

  /* ---------------- SEAT CLASS ---------------- */

  it('should return seat classes', () => {

    const seat = {
      type: 'SEATER',
      position: 'WINDOW',
      deck: 'UPPER',
      cabinClass: 'BUSINESS'
    };

    const result = component.seatClass(seat);

    expect(result.seater).toBeTrue();
    expect(result.window).toBeTrue();
    expect(result.business).toBeTrue();
  });

  /* ---------------- NAVIGATION ---------------- */

  it('should navigate back', () => {

    component.goback();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);
  });
it('should load flight layout and set aisle columns and business rows', () => {

  const flightLayout = {
    rows: 3,
    columns: 4,
    transportMode: 'FLIGHT',
    layoutType: 'BUS_SEATER',
    aisleColumns: [2],
    businessRows: 1,
    seats: []
  };

  apiSpy.getSeatLayoutByVehicleId.and.returnValue(
    of({ data: { layoutJSON: JSON.stringify(flightLayout) } })
  );

  component.loadExistingLayout();

  expect(component.isFlight).toBeTrue();
  expect(component.aisleColumns).toEqual([2]);
  expect(component.aisleInput).toBe('2');
  expect(component.businessRows).toBe(1);

});it('should shift column position for flight layout when column is after aisle', () => {

  component.isFlight = true;
  component.aisleColumns = [2];

  const result = component.getGridPosition(3);

  expect(result).toBe(4); // 3 + 1 shift
});it('should not shift column when column is before aisle in flight layout', () => {

  component.isFlight = true;
  component.aisleColumns = [3];

  const result = component.getGridPosition(2);

  expect(result).toBe(2);
});it('should apply multiple shifts for multiple aisles', () => {

  component.isFlight = true;
  component.aisleColumns = [2, 4];

  const result = component.getGridPosition(5);

  expect(result).toBe(7); // shifts twice
});it('should return column when no aisle shift applies', () => {

  component.isFlight = false;
  component.aisleColumn = 0; // no aisle

  const result = component.getGridPosition(3);

  expect(result).toBe(3);

});it('should return column when column is before aisle', () => {

  component.isFlight = false;
  component.aisleColumn = 3;

  const result = component.getGridPosition(2);

  expect(result).toBe(2);

});
it('should parse and sort aisle columns correctly for flight layout', () => {

  component.isFlight = true;
  component.columns = 6;
  component.capacity = 10;
  component.rows = 3;

  component.aisleInput = '4,1,3'; // unsorted

  component.generateSeats();

  expect(component.aisleColumns).toEqual([1, 3, 4]);

});
it('should filter invalid aisle column values', () => {

  component.isFlight = true;
  component.columns = 5;
  component.capacity = 10;
  component.rows = 3;

  component.aisleInput = '2,abc,6,-1';

  component.generateSeats();

  expect(component.aisleColumns).toEqual([2]);

});
it('should mark seat as AISLE when column matches aisle column', () => {

  component.isFlight = true;
  component.columns = 4;
  component.rows = 1;
  component.capacity = 4;

  component.aisleInput = '2'; // aisle between 2 and 3

  component.generateSeats();

  const aisleSeat = component.seats.find(s => s.column === 2);

  expect(aisleSeat?.position).toBe('AISLE');

});it('should mark seat as AISLE when column is after aisle column', () => {

  component.isFlight = true;
  component.columns = 4;
  component.rows = 1;
  component.capacity = 4;

  component.aisleInput = '2';

  component.generateSeats();

  const aisleSeat = component.seats.find(s => s.column === 3);

  expect(aisleSeat?.position).toBe('AISLE');

});it('should generate sleeper seats for BUS_SLEEPER layout', () => {

  component.isFlight = false;
  component.layoutType = 'BUS_SLEEPER';
  component.capacity = 4;
  component.rows = 2;
  component.columns = 2;

  component.generateSeats();

  expect(component.seats[0].type).toBe('SLEEPER');
  expect(component.seats[1].type).toBe('SLEEPER');

});it('should assign upper deck for even rows in BUS_SLEEPER', () => {

  component.isFlight = false;
  component.layoutType = 'BUS_SLEEPER';
  component.capacity = 4;
  component.rows = 2;
  component.columns = 1;

  component.generateSeats();

  const upperSeat = component.seats.find(s => s.row === 2);

  expect(upperSeat?.deck).toBe('UPPER');

});it('should generate mixed layout seats', () => {

  component.isFlight = false;
  component.layoutType = 'BUS_MIXED';
  component.capacity = 6;
  component.rows = 4;
  component.columns = 1;

  component.generateSeats();

  expect(component.seats[0].type).toBe('SEATER'); // first half
  expect(component.seats[3].type).toBe('SLEEPER'); // second half

});
});