import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainPrices } from './train-prices';
import { ActivatedRoute, Router } from '@angular/router';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('TrainPrices Component', () => {

  let component: TrainPrices;
  let fixture: ComponentFixture<TrainPrices>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj('Api_Calls', [
      'getVehicleById',
      'getSeatLayoutByVehicleId',
      'updateSeatLayout',
      'saveSeatLayout'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', ['error', 'success']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TrainPrices],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => key === 'vehicleId' ? '1' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrainPrices);
    component = fixture.componentInstance;

  });

  /* ---------------- COMPONENT CREATION ---------------- */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ---------------- NGONINIT ---------------- */

  it('should set vehicleId and call loaders on init', () => {

    spyOn(component, 'loadVehicleCapacity');
    spyOn(component, 'loadExistingPrices');

    component.ngOnInit();

    expect(component.vehicleId).toBe(1);
    expect(component.loadVehicleCapacity).toHaveBeenCalled();
    expect(component.loadExistingPrices).toHaveBeenCalled();

  });

  /* ---------------- LOAD VEHICLE CAPACITY ---------------- */

  it('should load vehicle capacity', () => {

    apiSpy.getVehicleById.and.returnValue(
      of({ data: { capacity: 100 } })
    );

    component.vehicleId = 1;

    component.loadVehicleCapacity();

    expect(component.capacity).toBe(100);

  });

  /* ---------------- LOAD EXISTING PRICES ---------------- */

  it('should load existing train seat layout', () => {

    const layout = {
      trainSeats: [
        { type: 'GENERAL', count: 10, BasePrice: 50 }
      ]
    };

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({
        data: { layoutJSON: JSON.stringify(layout) }
      })
    );

    component.vehicleId = 1;

    component.loadExistingPrices();

    expect(component.seatTypes.length).toBe(1);
    expect(component.isEditMode).toBeTrue();

  });

  it('should ignore if no layout JSON', () => {

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      of({ data: {} })
    );

    component.loadExistingPrices();

    expect(component.isEditMode).toBeFalse();

  });

  it('should handle layout API error', () => {

    apiSpy.getSeatLayoutByVehicleId.and.returnValue(
      throwError(() => new Error())
    );

    expect(() => component.loadExistingPrices()).not.toThrow();

  });

  /* ---------------- TOTAL SEATS ---------------- */

  it('should calculate total seats', () => {

    component.seatTypes = [
      { type: 'GENERAL', count: 10, BasePrice: 50 },
      { type: 'SLEEPER', count: 20, BasePrice: 100 }
    ];

    expect(component.totalSeats).toBe(30);

  });

  /* ---------------- SAVE VALIDATION ---------------- */

  it('should show error if seat count does not match capacity', () => {

    component.capacity = 50;

    component.seatTypes = [
      { type: 'GENERAL', count: 10, BasePrice: 50 }
    ];

    component.savePrices();

    expect(toastrSpy.error).toHaveBeenCalled();

  });

  /* ---------------- SAVE NEW LAYOUT ---------------- */

  it('should save new seat layout', () => {

    component.capacity = 10;

    component.seatTypes = [
      { type: 'GENERAL', count: 10, BasePrice: 50 }
    ];

    component.vehicleId = 1;

    apiSpy.saveSeatLayout.and.returnValue(of({}));

    component.savePrices();

    expect(apiSpy.saveSeatLayout).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalledWith('Train prices saved');
    expect(component.isEditMode).toBeTrue();

  });

  /* ---------------- UPDATE EXISTING LAYOUT ---------------- */

  it('should update existing seat layout', () => {

    component.capacity = 10;
    component.vehicleId = 1;
    component.isEditMode = true;

    component.seatTypes = [
      { type: 'GENERAL', count: 10, BasePrice: 50 }
    ];

    apiSpy.updateSeatLayout.and.returnValue(of({}));

    component.savePrices();

    expect(apiSpy.updateSeatLayout).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalledWith('Train prices updated');

  });

  /* ---------------- NAVIGATION ---------------- */

  it('should navigate back to vehicles', () => {

    component.goback();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);

  });

});