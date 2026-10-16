import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { AuthSignal } from '../../app/core/auth/auth-signal';
import { Api_Calls } from './api-calls';
import { DataFacade } from './data-fascade';

describe('DataFacade', () => {
  let facade: DataFacade;
  let api: jasmine.SpyObj<Api_Calls>;
  let toastr: jasmine.SpyObj<ToastrService>;
  let router: jasmine.SpyObj<Router>;
  let authSignal: jasmine.SpyObj<AuthSignal>;

  beforeEach(() => {
    api = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'login',
      'register',
      'getUserById',
      'getUsers',
      'updateUser',
      'getAllVehicles',
      'getVehiclesByTravelCompany',
      'getVehicleById',
      'addVehicle',
      'updateVehicle',
      'deactivateVehicle',
      'getMyTravelCompany',
      'getAllTravelCompanies',
      'uploadVehicleDocument',
      'getDocumentsByVehicle',
      'updateVehicleDocument',
      'getAllVehicleDocuments',
      'approveOrRejectDocument',
      'getAllVehicleInstance',
      'getVehicleInstanceByVehicleId',
      'getVehicleInstanceById',
      'searchVehicleInstances',
      'addVehicleInstance',
      'updateVehicleInstance',
      'deleteVehicleInstance',
      'getMyBookings',
      'bookings',
      'cancelPassenger',
      'cancelBooking',
      'getPassengers',
      'getRoutes',
      'getAllStops',
      'getAllRouteStopPoints',
      'getSeatLayoutByVehicleId',
      'saveSeatLayout',
      'updateSeatLayout',
      'updateSeatPrice',
      'getUnreadCount',
      'getMyNotifications',
      'getAllMyNotifications',
      'markAsRead',
      'getReviewsByVehicle',
      'getAverageRating',
      'getMyReviews',
      'addReview',
      'updateReview',
      'deleteReview'
    ]);

    toastr = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authSignal = jasmine.createSpyObj<AuthSignal>('AuthSignal', ['setToken', 'setUser', 'restoreFromStorage']);
    authSignal.setToken.and.callFake((token: string) => sessionStorage.setItem('token', token));
    router.navigate.and.returnValue(Promise.resolve(true));

    facade = new DataFacade(api, toastr, router, authSignal);
  });

  afterEach(() => {
    sessionStorage.clear();
    jasmine.clock().uninstall();
  });

  it('logs in successfully and updates auth state', () => {
    jasmine.clock().install();
    api.login.and.returnValue(of({
      status: true,
      data: {
        token: 'jwt-token',
        id: 1,
        name: 'Alex',
        email: 'alex@test.com',
        role: 'User',
        phoneNumber: '12345'
      }
    }));
    facade.loginUser({ email: 'alex@test.com', password: '123' });

    expect(authSignal.setToken).toHaveBeenCalledWith('jwt-token');
    expect(authSignal.setUser).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 1,
      name: 'Alex',
      isLoggedIn: true
    }));
    expect(sessionStorage.getItem('token')).toBe('jwt-token');
    expect(toastr.success).toHaveBeenCalledWith('Welcome Alex', 'Login Successful');

    jasmine.clock().tick(800);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('handles login failure responses and errors', () => {
    api.login.and.returnValue(of({ status: false, Message: 'Bad credentials' }));
    facade.loginUser({ email: 'x', password: 'y' });
    expect(toastr.error).toHaveBeenCalledWith('Bad credentials', 'Login Failed');

    api.login.and.returnValue(throwError(() => ({ error: { Message: 'Denied' } })));
    facade.loginUser({ email: 'x', password: 'y' });
    expect(toastr.error).toHaveBeenCalledWith('Denied', 'Login Failed');

    api.login.and.returnValue(throwError(() => ({ error: { message: 'Locked' } })));
    facade.loginUser({ email: 'x', password: 'y' });
    expect(toastr.error).toHaveBeenCalledWith('Locked', 'Login Failed');

    api.login.and.returnValue(throwError(() => ({ error: {} })));
    facade.loginUser({ email: 'x', password: 'y' });
    expect(toastr.error).toHaveBeenCalledWith('Something went wrong. Please try again.', 'Login Failed');
  });

  it('registers, loads users, updates users, clears state, and restores auth', async () => {
    api.register.and.returnValue(of({}));
    facade.registerUser({ name: 'User' });
    expect(toastr.success).toHaveBeenCalledWith('Registration successful');

    api.register.and.returnValue(throwError(() => new Error('fail')));
    facade.registerUser({ name: 'User' });
    expect(facade.error$.value).toBe('Registration failed');

    api.getUsers.and.returnValue(of({ data: [{ id: 1 }] }));
    facade.loadUsers();
    expect(facade.users$.value).toEqual([{ id: 1 }]);

    api.getUsers.and.returnValue(throwError(() => new Error('fail')));
    facade.loadUsers();
    expect(facade.error$.value).toBe('Failed to load users');

    api.updateUser.and.returnValue(of({}));
    facade.updateUser({ userId: 3 });
    expect(toastr.success).toHaveBeenCalledWith('Profile updated successfully');

    api.updateUser.and.returnValue(throwError(() => new Error('fail')));
    facade.updateUser({ userId: 3 });
    expect(facade.error$.value).toBe('Failed to update profile');

    const result = { id: 99 };
    api.getUserById.and.returnValue(of(result));
    expect(facade.loadUserById(99)).toBe(api.getUserById.calls.mostRecent().returnValue);

    facade.users$.next([{ id: 10 }]);
    facade.clearUserState();
    expect(facade.users$.value).toEqual([]);

    await facade.restoreAuth();
    expect(authSignal.restoreFromStorage).toHaveBeenCalled();
  });

  it('loads and mutates vehicle state across success and failure paths', () => {
    api.getAllVehicles.and.returnValue(of({ status: true, data: [{ id: 1, travelCompany: { ownerId: 9 }, modeOfTransport: 'Bus' }] }));
    facade.loadAllVehicles();
    expect(facade.vehicles$.value).toEqual([{ id: 1, travelCompany: { ownerId: 9 }, modeOfTransport: 'Bus' }]);

    api.getAllVehicles.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllVehicles();
    expect(facade.error$.value).toBe('Failed to load vehicles');

    facade.loadVehiclesByCompany(0);
    expect(facade.error$.value).toBe('Company not found');

    api.getVehiclesByTravelCompany.and.returnValue(of({ data: [{ id: 2 }] }));
    facade.loadVehiclesByCompany(2);
    expect(facade.vehicles$.value).toEqual([{ id: 2 }]);

    api.getVehicleById.and.returnValue(of({ data: { id: 3 } }));
    facade.getVehicleById(3);
    expect(facade.vehicles$.value).toEqual([{ id: 3 }]);

    api.addVehicle.and.returnValue(of({}));
    facade.addVehicle({ id: 4 });
    expect(toastr.success).toHaveBeenCalledWith('Vehicle added successfully');

    api.updateVehicle.and.returnValue(of({}));
    facade.updateVehicle(4, new FormData());
    expect(toastr.success).toHaveBeenCalledWith('Vehicle updated successfully');

    api.deactivateVehicle.and.returnValue(of({}));
    facade.deactivateVehicle(4);
    expect(toastr.success).toHaveBeenCalledWith('Vehicle deactivated');

    api.getAllVehicles.and.returnValue(of({
      status: true,
      data: [
        { id: 1, travelCompany: { ownerId: 1 }, modeOfTransport: 'Bus' },
        { id: 2, travelCompany: { ownerId: 1 }, modeOfTransport: 'Train' },
        { id: 3, travelCompany: { ownerId: 2 }, modeOfTransport: 'Bus' }
      ]
    }));
    facade.loadVehicles(1, 'Bus');
    expect(facade.vehicles$.value).toEqual([
      { id: 1, travelCompany: { ownerId: 1 }, modeOfTransport: 'Bus' }
    ]);
  });

  it('handles travel company and vehicle document operations', () => {
    const companyResponse = of({ data: { companyId: 4 } });
    api.getMyTravelCompany.and.returnValue(companyResponse);
    expect(facade.loadMyTravelCompany()).toBe(companyResponse);

    api.getAllTravelCompanies.and.returnValue(of({ data: [{ companyId: 1 }] }));
    facade.loadAllTravelCompanies();
    expect(facade.users$.value).toEqual([{ companyId: 1 }]);

    api.uploadVehicleDocument.and.returnValue(of({}));
    facade.uploadVehicleDocument({ doc: true });
    expect(toastr.success).toHaveBeenCalledWith('Document uploaded successfully');

    api.getDocumentsByVehicle.and.returnValue(of({ data: [{ documentId: 8 }] }));
    facade.loadVehicleDocuments(8);
    expect(facade.vehicleDocuments$.value).toEqual([{ documentId: 8 }]);

    api.updateVehicleDocument.and.returnValue(of({}));
    facade.updateVehicleDocument(8, new FormData());
    expect(toastr.success).toHaveBeenCalledWith('Document updated successfully');

    api.getAllVehicleDocuments.and.returnValue(of({ data: [{ documentId: 9 }] }));
    facade.loadAllVehicleDocuments();
    expect(facade.vehicleDocuments$.value).toEqual([{ documentId: 9 }]);

    const approvalResponse = of({ status: true });
    api.approveOrRejectDocument.and.returnValue(approvalResponse);
    expect(facade.approveOrRejectVehicleDocument(1, 'Approved', 'Good', 'ok')).toBe(approvalResponse);
  });

  it('handles vehicle instance operations, including invalid inputs and deletion updates', () => {
    api.getAllVehicleInstance.and.returnValue(of({ data: [{ instanceId: 1 }] }));
    facade.loadAllVehicleInstances();
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 1 }]);

    facade.loadVehicleInstancesByVehicleId(0);
    expect(facade.error$.value).toBe('Vehicle not found');

    api.getVehicleInstanceByVehicleId.and.returnValue(of({ status: true, data: [{ instanceId: 2 }] }));
    facade.loadVehicleInstancesByVehicleId(2);
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 2 }]);

    facade.loadVehicleInstanceById(0);
    expect(facade.error$.value).toBe('Instance not found');

    api.getVehicleInstanceById.and.returnValue(of({ status: true, data: { instanceId: 3 } as any }));
    facade.loadVehicleInstanceById(3);
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 3 }]);

    facade.searchVehicleInstances(0, 2, '');
    expect(facade.error$.value).toBe('Invalid search parameters');

    api.searchVehicleInstances.and.returnValue(of({ data: [{ instanceId: 4 }] }));
    facade.searchVehicleInstances(1, 2, '2026-04-20');
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 4 }]);

    api.addVehicleInstance.and.returnValue(of({}));
    facade.addVehicleInstance({ instanceId: 5 });
    expect(toastr.success).toHaveBeenCalledWith('Vehicle instance added successfully');

    api.updateVehicleInstance.and.returnValue(of({}));
    facade.updateVehicleInstance({ instanceId: 5 });
    expect(toastr.success).toHaveBeenCalledWith('Vehicle instance updated successfully');

    facade.vehicleInstances$.next([{ instanceId: 5 }, { instanceId: 6 }]);
    api.deleteVehicleInstance.and.returnValue(of({}));
    facade.deleteVehicleInstance(5);
    expect(toastr.success).toHaveBeenCalledWith('Vehicle instance deleted');
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 6 }]);
  });

  it('handles bookings, passengers, routes, and stop loading', () => {
    api.getMyBookings.and.returnValue(of({ status: true, data: [{ bookingId: 1 }] }));
    facade.loadMyBookings();
    expect(facade.bookings$.value).toEqual([{ bookingId: 1 }]);

    api.bookings.and.returnValue(of({ status: true, data: [{ bookingId: 2 }] }));
    facade.loadAllBookings();
    expect(facade.bookings$.value).toEqual([{ bookingId: 2 }]);

    api.cancelPassenger.and.returnValue(of({}));
    facade.cancelPassenger(10);
    expect(toastr.success).toHaveBeenCalledWith('Passenger cancelled successfully');

    api.cancelBooking.and.returnValue(of({}));
    facade.cancelBooking(11);
    expect(toastr.success).toHaveBeenCalledWith('Booking cancelled');

    api.getPassengers.and.returnValue(of({ status: true, data: [{ passengerId: 12 }] }));
    facade.loadPassengers(11);
    expect(facade.passengers$.value).toEqual([{ passengerId: 12 }]);

    api.getRoutes.and.returnValue(of({ status: true, data: [{ routeId: 1 }] }));
    facade.loadRoutes();
    expect(facade.routes$.value).toEqual([{ routeId: 1 }]);

    api.getAllStops.and.returnValue(of({ status: true, data: [{ stopId: 1 }] }));
    facade.loadAllStops();
    expect(facade.stops$.value).toEqual([{ stopId: 1 }]);

    api.getAllRouteStopPoints.and.returnValue(of({ status: true, data: [{ stopId: 2 }] }));
    facade.loadAllRouteStopPoints();
    expect(facade.stops$.value).toEqual([{ stopId: 2 }]);
  });

  it('handles seat layout operations and related failures', () => {
    facade.loadSeatLayout(0);
    expect(facade.error$.value).toBe('Vehicle not found');

    api.getSeatLayoutByVehicleId.and.returnValue(of({ data: { layoutJSON: '{}' } }));
    facade.loadSeatLayout(9);
    expect(facade.vehicles$.value).toEqual([{ layoutJSON: '{}' }]);

    api.saveSeatLayout.and.returnValue(of({}));
    facade.saveSeatLayout({ vehicleId: 1, layoutJSON: '{}' });
    expect(toastr.success).toHaveBeenCalledWith('Seat layout saved');

    api.updateSeatLayout.and.returnValue(of({}));
    facade.updateSeatLayout(1, '{}');
    expect(toastr.success).toHaveBeenCalledWith('Seat layout updated');

    api.updateSeatPrice.and.returnValue(of({}));
    facade.updateSeatPrice(1, 'A1', 200);
    expect(toastr.success).toHaveBeenCalledWith('Seat price updated');
  });

  it('handles notification loading and mark-as-read state updates', () => {
    api.getUnreadCount.and.returnValue(of({ data: 5 }));
    facade.loadUnreadCount();
    expect(facade.unreadCount$.value).toBe(5);

    api.getUnreadCount.and.returnValue(throwError(() => new Error('fail')));
    facade.loadUnreadCount();
    expect(facade.unreadCount$.value).toBe(0);

    api.getMyNotifications.and.returnValue(of({ data: [{ notificationId: 1, isRead: false }] }));
    facade.loadMyNotifications();
    expect(facade.notifications$.value).toEqual([{ notificationId: 1, isRead: false }]);

    api.getAllMyNotifications.and.returnValue(of({ data: [{ notificationId: 2, isRead: false }] }));
    facade.loadAllMyNotifications();
    expect(facade.notifications$.value).toEqual([{ notificationId: 2, isRead: false }]);

    facade.notifications$.next([{ notificationId: 2, isRead: false }]);
    facade.unreadCount$.next(2);
    api.markAsRead.and.returnValue(of({}));
    facade.markNotificationAsRead(2);
    expect(facade.notifications$.value).toEqual([{ notificationId: 2, isRead: true }]);
    expect(facade.unreadCount$.value).toBe(1);

    api.markAsRead.and.returnValue(throwError(() => new Error('fail')));
    facade.markNotificationAsRead(2);
    expect(toastr.error).toHaveBeenCalledWith('Failed to mark notification as read');
  });

  it('handles review loading, rating, and CRUD responses', () => {
    facade.loadReviewsByVehicle(0);
    expect(facade.error$.value).toBe('Invalid vehicle');

    api.getReviewsByVehicle.and.returnValue(of({ data: [{ reviewId: 1 }] }));
    facade.loadReviewsByVehicle(1);
    expect(facade.reviews$.value).toEqual([{ reviewId: 1 }]);

    facade.loadAverageRating(0);
    expect(facade.error$.value).toBe('Invalid vehicle');

    api.getAverageRating.and.returnValue(of({ data: 4.5 }));
    facade.loadAverageRating(1);
    expect(facade.averageRating$.value).toBe(4.5);

    api.getAverageRating.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAverageRating(1);
    expect(facade.averageRating$.value).toBe(0);

    api.getMyReviews.and.returnValue(of({ data: [{ reviewId: 2 }] }));
    facade.loadMyReviews();
    expect(facade.myReviews$.value).toEqual([{ reviewId: 2 }]);

    api.addReview.and.returnValue(of({ status: true, message: 'Added' }));
    facade.addReview({ rating: 5 });
    expect(toastr.success).toHaveBeenCalledWith('Added');

    api.addReview.and.returnValue(of({ status: false, message: 'Rejected' }));
    facade.addReview({ rating: 1 });
    expect(toastr.error).toHaveBeenCalledWith('Rejected');

    api.updateReview.and.returnValue(of({ status: true, message: 'Updated' }));
    facade.updateReview(1, { rating: 4 });
    expect(toastr.success).toHaveBeenCalledWith('Updated');

    api.deleteReview.and.returnValue(of({ status: true, message: 'Deleted' }));
    facade.deleteReview(1);
    expect(toastr.success).toHaveBeenCalledWith('Deleted');
  });

  it('covers remaining vehicle and company failure paths', () => {
    facade.loadVehicles(0, 'Bus');
    expect(facade.error$.value).toBe('Owner not found');

    api.getVehiclesByTravelCompany.and.returnValue(throwError(() => new Error('fail')));
    facade.loadVehiclesByCompany(10);
    expect(facade.error$.value).toBe('Failed to load company vehicles');

    api.getVehicleById.and.returnValue(throwError(() => new Error('fail')));
    facade.getVehicleById(1);
    expect(facade.error$.value).toBe('Failed to load vehicle');

    api.addVehicle.and.returnValue(throwError(() => new Error('fail')));
    facade.addVehicle({ id: 1 });
    expect(facade.error$.value).toBe('Failed to add vehicle');

    api.updateVehicle.and.returnValue(throwError(() => new Error('fail')));
    facade.updateVehicle(1, new FormData());
    expect(facade.error$.value).toBe('Failed to update vehicle');

    api.deactivateVehicle.and.returnValue(throwError(() => new Error('fail')));
    facade.deactivateVehicle(1);
    expect(facade.error$.value).toBe('Vehicle deactivation failed');

    api.getAllTravelCompanies.and.returnValue(of([{ companyId: 2 }]));
    facade.loadAllTravelCompanies();
    expect(facade.users$.value).toEqual([{ companyId: 2 }]);

    api.getAllTravelCompanies.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllTravelCompanies();
    expect(facade.error$.value).toBe('Failed to load travel companies');
  });

  it('covers remaining document failure paths', () => {
    api.uploadVehicleDocument.and.returnValue(throwError(() => new Error('fail')));
    facade.uploadVehicleDocument({ doc: true });
    expect(facade.error$.value).toBe('Document upload failed');

    api.getDocumentsByVehicle.and.returnValue(throwError(() => new Error('fail')));
    facade.loadVehicleDocuments(3);
    expect(facade.error$.value).toBe('Failed to load vehicle documents');

    api.updateVehicleDocument.and.returnValue(throwError(() => new Error('fail')));
    facade.updateVehicleDocument(3, new FormData());
    expect(facade.error$.value).toBe('Failed to update document');

    api.getAllVehicleDocuments.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllVehicleDocuments();
    expect(facade.error$.value).toBe('Failed to load all documents');
  });

  it('covers remaining vehicle instance branches', () => {
    api.getAllVehicleInstance.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllVehicleInstances();
    expect(facade.error$.value).toBe('Failed to load vehicle instances');

    api.getVehicleInstanceByVehicleId.and.returnValue(throwError(() => new Error('fail')));
    facade.loadVehicleInstancesByVehicleId(7);
    expect(facade.error$.value).toBe('Failed to load vehicle instances');

    api.getVehicleInstanceById.and.returnValue(of({ data: [{ instanceId: 10 }] } as any));
    facade.loadVehicleInstanceById(10);
    expect(facade.vehicleInstances$.value).toEqual([{ instanceId: 10 }]);

    api.getVehicleInstanceById.and.returnValue(throwError(() => new Error('fail')));
    facade.loadVehicleInstanceById(10);
    expect(facade.error$.value).toBe('Failed to load vehicle instance');

    api.searchVehicleInstances.and.returnValue(throwError(() => new Error('fail')));
    facade.searchVehicleInstances(1, 2, '2026-04-20');
    expect(facade.error$.value).toBe('Failed to search vehicle instances');

    api.addVehicleInstance.and.returnValue(throwError(() => new Error('fail')));
    facade.addVehicleInstance({ instanceId: 9 });
    expect(facade.error$.value).toBe('Failed to add vehicle instance');

    api.updateVehicleInstance.and.returnValue(throwError(() => new Error('fail')));
    facade.updateVehicleInstance({ instanceId: 9 });
    expect(facade.error$.value).toBe('Failed to update vehicle instance');

    facade.deleteVehicleInstance(0);
    expect(facade.error$.value).toBe('Instance not found');

    api.deleteVehicleInstance.and.returnValue(throwError(() => new Error('fail')));
    facade.deleteVehicleInstance(9);
    expect(facade.error$.value).toBe('Failed to delete vehicle instance');
  });

  it('covers remaining booking, route, and stop failure paths', () => {
    api.getMyBookings.and.returnValue(throwError(() => new Error('fail')));
    facade.loadMyBookings();
    expect(facade.error$.value).toBe('Failed to load bookings');

    api.bookings.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllBookings();
    expect(facade.error$.value).toBe('Failed to load all bookings');

    api.cancelPassenger.and.returnValue(throwError(() => new Error('fail')));
    facade.cancelPassenger(1);
    expect(facade.error$.value).toBe('Failed to cancel passenger');

    api.cancelBooking.and.returnValue(throwError(() => new Error('fail')));
    facade.cancelBooking(1);
    expect(facade.error$.value).toBe('Booking cancellation failed');

    api.getPassengers.and.returnValue(throwError(() => new Error('fail')));
    facade.loadPassengers(1);
    expect(facade.error$.value).toBe('Failed to load passengers');

    api.getRoutes.and.returnValue(throwError(() => new Error('fail')));
    facade.loadRoutes();
    expect(facade.error$.value).toBe('Failed to load routes');

    api.getAllStops.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllStops();
    expect(facade.error$.value).toBe('Failed to load stops');

    api.getAllRouteStopPoints.and.returnValue(of([{ stopId: 3 }] as any));
    facade.loadAllRouteStopPoints();
    expect(facade.stops$.value).toEqual([{ stopId: 3 }]);

    api.getAllRouteStopPoints.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllRouteStopPoints();
    expect(facade.error$.value).toBe('Failed to load route stop points');
  });

  it('covers remaining seat layout and notification failure branches', () => {
    api.getSeatLayoutByVehicleId.and.returnValue(throwError(() => new Error('fail')));
    facade.loadSeatLayout(5);
    expect(facade.error$.value).toBe('Failed to load seat layout');

    api.saveSeatLayout.and.returnValue(throwError(() => new Error('fail')));
    facade.saveSeatLayout({ vehicleId: 1, layoutJSON: '{}' });
    expect(facade.error$.value).toBe('Failed to save seat layout');

    api.updateSeatLayout.and.returnValue(throwError(() => new Error('fail')));
    facade.updateSeatLayout(1, '{}');
    expect(facade.error$.value).toBe('Failed to update seat layout');

    api.updateSeatPrice.and.returnValue(throwError(() => new Error('fail')));
    facade.updateSeatPrice(1, 'A1', 100);
    expect(facade.error$.value).toBe('Failed to update seat price');

    api.getMyNotifications.and.returnValue(throwError(() => new Error('fail')));
    facade.loadMyNotifications();
    expect(facade.error$.value).toBe('Failed to load notifications');

    api.getAllMyNotifications.and.returnValue(throwError(() => new Error('fail')));
    facade.loadAllMyNotifications();
    expect(facade.error$.value).toBe('Failed to load all notifications');

    facade.unreadCount$.next(0);
    api.markAsRead.and.returnValue(of({}));
    facade.markNotificationAsRead(999);
    expect(facade.unreadCount$.value).toBe(0);
  });

  it('covers remaining review failure and false-status branches', () => {
    api.getReviewsByVehicle.and.returnValue(throwError(() => new Error('fail')));
    facade.loadReviewsByVehicle(4);
    expect(facade.error$.value).toBe('Failed to load reviews');

    api.getMyReviews.and.returnValue(throwError(() => new Error('fail')));
    facade.loadMyReviews();
    expect(facade.myReviews$.value).toEqual([]);

    api.addReview.and.returnValue(throwError(() => new Error('fail')));
    facade.addReview({ rating: 3 });
    expect(facade.error$.value).toBe('Failed to add review');

    api.updateReview.and.returnValue(of({ status: false, message: 'Update rejected' }));
    facade.updateReview(1, { rating: 2 });
    expect(toastr.error).toHaveBeenCalledWith('Update rejected');

    api.updateReview.and.returnValue(throwError(() => new Error('fail')));
    facade.updateReview(1, { rating: 2 });
    expect(facade.error$.value).toBe('Failed to update review');

    api.deleteReview.and.returnValue(of({ status: false, message: 'Delete rejected' }));
    facade.deleteReview(1);
    expect(toastr.error).toHaveBeenCalledWith('Delete rejected');

    api.deleteReview.and.returnValue(throwError(() => new Error('fail')));
    facade.deleteReview(1);
    expect(facade.error$.value).toBe('Failed to delete review');
  });
});
