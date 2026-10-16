import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reviews } from './reviews';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';

describe('Reviews Component', () => {

  let component: Reviews;
  let fixture: ComponentFixture<Reviews>;

  let facadeSpy: jasmine.SpyObj<DataFacade>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const routeMock = {
    snapshot: {
      queryParamMap: {
        get: (key: string) => {
          if (key === 'vehicleId') return '10';
          if (key === 'bookingId') return '20';
          return null;
        }
      }
    }
  };
  beforeEach(async () => {

    // FIX: block timers from Stop component (Leaflet map.invalidateSize)
    spyOn(window as any, 'setTimeout').and.callFake(() => 0);

    facadeSpy = jasmine.createSpyObj<DataFacade>('DataFacade', [
      'loadReviewsByVehicle',
      'loadAverageRating',
      'loadMyReviews',
      'addReview',
      'updateReview',
      'deleteReview'
    ], {
      reviews$: new BehaviorSubject<any[]>([]),
      myReviews$: new BehaviorSubject<any[]>([]),
      averageRating$: new BehaviorSubject<number>(0)
    });

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Reviews],
      providers: [
        { provide: DataFacade, useValue: facadeSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Reviews);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });
  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should read query params and load data', () => {

    spyOn<any>(component, 'loadData');

    component.ngOnInit();

    expect(component.vehicleId).toBe(10);
    expect(component.bookingId).toBe(20);
    expect((component as any).loadData).toHaveBeenCalled();
  });

  it('should show error if vehicleId missing', () => {

    const badRoute = {
      snapshot: {
        queryParamMap: {
          get: () => null
        }
      }
    };

    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [Reviews],
      providers: [
        { provide: DataFacade, useValue: facadeSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ActivatedRoute, useValue: badRoute }
      ]
    }).compileComponents();

    const badFixture = TestBed.createComponent(Reviews);
    const badComponent = badFixture.componentInstance;

    badComponent.ngOnInit();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  /* ---------------- LOAD DATA ---------------- */

  it('should load data from facade', () => {

    (component as any).loadData();

    expect(facadeSpy.loadReviewsByVehicle).toHaveBeenCalledWith(10);
    expect(facadeSpy.loadAverageRating).toHaveBeenCalledWith(10);
    expect(facadeSpy.loadMyReviews).toHaveBeenCalled();
  });

  /* ---------------- GETTERS ---------------- */

  it('should return reviews', () => {

    facadeSpy.reviews$.next([{ reviewId: 1 }]);

    expect(component.reviews.length).toBe(1);
  });

  it('should return my reviews', () => {

    facadeSpy.myReviews$.next([{ reviewId: 2 }]);

    expect(component.myReviews.length).toBe(1);
  });

  it('should return average rating', () => {

    facadeSpy.averageRating$.next(4.5);

    expect(component.averageRating).toBe(4.5);
  });

  it('should detect my review', () => {

    facadeSpy.myReviews$.next([{ reviewId: 10 }]);

    expect(component.isMyReview(10)).toBeTrue();
  });

  it('should return false if review not mine', () => {

    facadeSpy.myReviews$.next([{ reviewId: 10 }]);

    expect(component.isMyReview(20)).toBeFalse();
  });

  /* ---------------- STAR UI ---------------- */

  it('should set rating', () => {

    component.setRating(4);

    expect(component.rating).toBe(4);
  });

  it('should detect filled star', () => {

    component.rating = 3;

    expect(component.isFilledStar(2)).toBeTrue();
  });

  it('should detect empty star', () => {

    component.rating = 2;

    expect(component.isFilledStar(4)).toBeFalse();
  });

  it('should generate star array', () => {

    const stars = component.starArray(5);

    expect(stars.length).toBe(5);
  });

  /* ---------------- ADD REVIEW ---------------- */

  it('should show warning if rating not selected', () => {

    component.rating = 0;

    component.submitReview();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should add review successfully', () => {

    component.rating = 4;
    component.comments = 'Good vehicle';

    component.submitReview();

    expect(facadeSpy.addReview).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/bookings']);
  });

  /* ---------------- UPDATE REVIEW ---------------- */

  it('should update review', () => {

    component.rating = 5;
    component.comments = 'Excellent';
    component.editingReviewId = 1;

    component.submitReview();

    expect(facadeSpy.updateReview).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalledWith('Review updated');
  });

  /* ---------------- EDIT REVIEW ---------------- */

  it('should load review into form for editing', () => {

    const review = {
      reviewId: 5,
      rating: 4,
      comments: 'Nice'
    };

    component.editReview(review);

    expect(component.editingReviewId).toBe(5);
    expect(component.rating).toBe(4);
    expect(component.comments).toBe('Nice');
  });

  /* ---------------- DELETE REVIEW ---------------- */

  it('should delete review if confirmed', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteReview(10);

    expect(facadeSpy.deleteReview).toHaveBeenCalledWith(10);
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('should not delete review if cancelled', () => {

    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteReview(10);

    expect(facadeSpy.deleteReview).not.toHaveBeenCalled();
  });

  /* ---------------- RESET FORM ---------------- */

  it('should reset form', () => {

    component.rating = 5;
    component.comments = 'Test';
    component.editingReviewId = 10;

    component.resetForm();

    expect(component.rating).toBe(0);
    expect(component.comments).toBe('');
    expect(component.editingReviewId).toBeNull();
  });

});
