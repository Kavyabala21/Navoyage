import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Api_Calls } from './api-calls';

describe('Api_Calls', () => {
  let service: Api_Calls;
  let http: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post', 'put', 'delete']);
    http.get.and.returnValue(of({}));
    http.post.and.returnValue(of({}));
    http.put.and.returnValue(of({}));
    http.delete.and.returnValue(of({}));

    sessionStorage.setItem('token', 'test-token');
    service = new Api_Calls(http);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function expectAuthOptions(options: any, includeContentType: boolean = true) {
    expect(options.headers.get('Authorization')).toBe('Bearer test-token');
    if (includeContentType) {
      expect(options.headers.get('Content-Type')).toBe('application/json');
    } else {
      expect(options.headers.has('Content-Type')).toBeFalse();
    }
  }

  it('calls booking endpoints with the expected URLs', () => {
    service.bookings();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/GetAll',
      jasmine.any(Object)
    );
    expectAuthOptions(http.get.calls.mostRecent().args[1]);

    service.createBooking({ id: 1 });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/CreateBooking',
      { id: 1 },
      jasmine.any(Object)
    );
    expectAuthOptions(http.post.calls.mostRecent().args[2]);

    service.getTravelCompanyBookings();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/GetBookingsByTravelCompany',
      jasmine.any(Object)
    );

    service.getMyBookings();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/MyBookings',
      jasmine.any(Object)
    );

    service.getBookingsByInstanceId(10);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/GetBookingsByInstanceId?instanceId=10',
      jasmine.any(Object)
    );

    service.getByPNR('ABC123');
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/GetByPNR?PNR=ABC123'
    );

    service.cancelBooking(5);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/Cancel/5',
      {},
      jasmine.any(Object)
    );

    service.cancelPassenger(7);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Passenger/CancelBookingForPassenger/7',
      {},
      jasmine.any(Object)
    );

    service.getTotalBookings();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Booking/TotalBookingsCount',
      jasmine.any(Object)
    );

    service.getPassengers(9);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Passenger/PassengersByBookingId/9',
      jasmine.any(Object)
    );
  });

  it('calls user endpoints with the expected URLs', () => {
    service.login({ email: 'a@b.com' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/Login',
      { email: 'a@b.com' }
    );

    service.register({ name: 'Test' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/AddUser',
      { name: 'Test' }
    );

    service.getUserById(1);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/GetUserById/1',
      jasmine.any(Object)
    );

    service.getMyProfile();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/GetMyProfile',
      jasmine.any(Object)
    );

    service.getUsers();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/GetAllUsers',
      jasmine.any(Object)
    );

    const payload = { userId: 4, name: 'Updated' };
    service.updateUser(payload);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/User/UpdateUser/4',
      payload,
      jasmine.any(Object)
    );
  });

  it('calls vehicle and vehicle-document endpoints with the expected URLs', () => {
    const formData = new FormData();

    service.getAllVehicles();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/GetAllVehicles',
      jasmine.any(Object)
    );

    service.addVehicle(formData);
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/AddVehicle',
      formData,
      jasmine.any(Object)
    );
    expectAuthOptions(http.post.calls.mostRecent().args[2], false);

    service.getVehiclesByTravelCompany(2);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/GetVehicleByCompanyId/2',
      jasmine.any(Object)
    );

    service.getVehicleById(3);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/GetVehicleById/3',
      jasmine.any(Object)
    );

    service.updateVehicle(3, formData);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/UpdateVehicle/3',
      formData,
      jasmine.any(Object)
    );

    service.deactivateVehicle(3);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Vehicle/DeactivateVehicle/3',
      {},
      jasmine.any(Object)
    );

    service.uploadVehicleDocument(formData);
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/UploadVehicleDocuments',
      formData,
      jasmine.any(Object)
    );

    service.getDocumentsByVehicle(11);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/GetDocumentsByVehicleId/11',
      jasmine.any(Object)
    );

    service.updateVehicleDocument(12, formData);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/UpdateDocument/12',
      formData,
      jasmine.any(Object)
    );

    service.getAllVehicleDocuments();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/GetAllDocuments',
      jasmine.any(Object)
    );
  });

  it('calls vehicle-document admin endpoints with params and blob response', () => {
    service.approveOrRejectDocument(15, 'Approved', 'Good', 'Looks fine');
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/ApproveOrRejectDocument/15',
      null,
      jasmine.objectContaining({
        params: {
          status: 'Approved',
          vehicleCondition: 'Good',
          remarks: 'Looks fine'
        }
      })
    );

    service.downloadVehicleDocument(16);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleDocument/DownloadDocument/16',
      jasmine.objectContaining({
        responseType: 'blob'
      })
    );
  });

  it('calls vehicle-instance endpoints with the expected URLs', () => {
    service.getAllVehicleInstance();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/GetAllVehicleInstances',
      jasmine.any(Object)
    );

    service.updateVehicleInstance({ instanceId: 1 });
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/Update',
      { instanceId: 1 },
      jasmine.any(Object)
    );

    service.searchVehicleInstances(1, 2, '2026-04-20');
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/Search?startId=1&endId=2&departureDate=2026-04-20'
    );

    service.addVehicleInstance({ routeId: 3 });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/Add',
      { routeId: 3 },
      jasmine.any(Object)
    );

    service.getVehicleInstanceById(4);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/GetById/4',
      jasmine.any(Object)
    );

    service.getVehicleInstanceByVehicleId(5);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/GetVehicleInstanceByVehicleId/5',
      jasmine.any(Object)
    );

    service.deleteVehicleInstance(6);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/DeleteVehicleInstance/6',
      {},
      jasmine.any(Object)
    );

    service.cancleVehiclInstance(7);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/VehicleInstance/CancelVehicleInstance/7',
      {},
      jasmine.any(Object)
    );
  });

  it('calls route and route-stop-point endpoints with the expected URLs', () => {
    service.getRoutes();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/GetAllRoutes',
      jasmine.any(Object)
    );

    service.getRouteById(1);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/GetRouteById/1',
      jasmine.any(Object)
    );

    service.getRoutesByOwnerId();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/GetRouteByOwnerId',
      jasmine.any(Object)
    );

    service.addRoute({ routeName: 'Express' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/AddRoute',
      { routeName: 'Express' },
      jasmine.any(Object)
    );

    service.updateRoute({ routeId: 2, routeName: 'Updated' });
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/UpdateRoute',
      { routeId: 2, routeName: 'Updated' },
      jasmine.any(Object)
    );

    service.deleteRoute(3);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/DeleteRoute/3',
      {},
      jasmine.any(Object)
    );

    service.getRoutesByFromTo(4, 5);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Routes/GetRouteByFromToLocations',
      jasmine.objectContaining({
        params: {
          fromStopId: 4,
          toStopId: 5
        }
      })
    );

    service.getAllRouteStopPoints();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/GetAll',
      jasmine.any(Object)
    );

    service.getRouteStopPointById(6);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/GetById/6',
      jasmine.any(Object)
    );

    service.getRouteStopPointsByRouteId(7);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/GetRouteStopPointByRouteId/7',
      jasmine.any(Object)
    );

    service.addRouteStopPoint({ routeId: 1, stopId: 2, sequenceOrder: 3 });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/Add',
      { routeId: 1, stopId: 2, sequenceOrder: 3 },
      jasmine.any(Object)
    );

    service.updateRouteStopPoint({
      routeStopPointId: 1,
      routeId: 1,
      stopId: 2,
      sequenceOrder: 4
    });
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/Update',
      {
        routeStopPointId: 1,
        routeId: 1,
        stopId: 2,
        sequenceOrder: 4
      },
      jasmine.any(Object)
    );

    service.deleteRouteStopPoint(8);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/RouteStopPoint/Delete/8',
      {},
      jasmine.any(Object)
    );
  });

  it('calls travel-company, seat-layout, and notification endpoints with the expected URLs', () => {
    service.getMyTravelCompany();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/TravelCompany/GetMyCompany',
      jasmine.any(Object)
    );

    service.getAllTravelCompanies();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/TravelCompany/GetAllCompanies',
      jasmine.any(Object)
    );

    service.getSeatLayoutByVehicleId(9);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/SeatLayout/GetSeatLayoutByVehicleId/9',
      jasmine.any(Object)
    );

    service.saveSeatLayout({ vehicleId: 9, layoutJSON: '{}' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/SeatLayout/SaveSeatLayout',
      { vehicleId: 9, layoutJSON: '{}' },
      jasmine.any(Object)
    );

    service.updateSeatLayout(9, '{"rows":1}');
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/SeatLayout/UpdateSeatLayout',
      { vehicleId: 9, layoutJSON: '{"rows":1}' },
      jasmine.any(Object)
    );

    service.updateSeatPrice(9, 'A1', 199);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/SeatLayout/UpdateSeatPrice',
      { vehicleId: 9, seatNo: 'A1', price: 199 },
      jasmine.any(Object)
    );

    service.getUnreadCount();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/notifications/UnreadNotificationsCount',
      jasmine.any(Object)
    );

    service.getMyNotifications();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/notifications/GetMyNotifications',
      jasmine.any(Object)
    );

    service.getAllMyNotifications();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/notifications/GetAllMyNotifications',
      jasmine.any(Object)
    );

    service.markAsRead(10);
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/notifications/MarkAsRead/10',
      {},
      jasmine.any(Object)
    );
  });

  it('calls distance, review, stop, payment, and AI endpoints with the expected URLs', () => {
    service.distance(1, 2);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Distance/calculate?sourceStopId=1&destinationStopId=2'
    );

    service.addReview({ rating: 5 });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/AddReview',
      { rating: 5 },
      jasmine.any(Object)
    );

    service.updateReview(3, { rating: 4 });
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/UpdateReview/3',
      { rating: 4 },
      jasmine.any(Object)
    );

    service.deleteReview(4);
    expect(http.delete).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/DeleteReview/4',
      jasmine.any(Object)
    );

    service.getReviewById(5);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/GetReviewById/5',
      jasmine.any(Object)
    );

    service.getMyReviews();
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/GetMyReviews',
      jasmine.any(Object)
    );

    service.getReviewsByVehicle(6);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/GetReviewsByVehicle/6'
    );

    service.getReviewsByBookig(7);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/GetReviewsByBooking/7'
    );

    service.getAverageRating(8);
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:5000/api/Review/Vehicle/8/AverageRating'
    );

    service.getAllStops();
    expect(http.get).toHaveBeenCalledWith('http://localhost:5000/api/Stop');

    service.getStopById(9);
    expect(http.get).toHaveBeenCalledWith('http://localhost:5000/api/Stop/9');

    service.createStop({ stopName: 'A', latitude: 1, longitude: 2 });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/Stop',
      { stopName: 'A', latitude: 1, longitude: 2 },
      jasmine.any(Object)
    );

    service.updateStop(10, { stopName: 'B', latitude: 3, longitude: 4 });
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/Stop/10',
      { stopName: 'B', latitude: 3, longitude: 4 },
      jasmine.any(Object)
    );

    service.deleteStop(11);
    expect(http.delete).toHaveBeenCalledWith(
      'http://localhost:5000/api/Stop/11',
      jasmine.any(Object)
    );

    service.createOrder(1200);
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/payment/create-order',
      { amount: 1200 },
      jasmine.any(Object)
    );

    service.verifyPayment({ paymentId: 'p1' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/payment/verify-payment',
      { paymentId: 'p1' },
      jasmine.any(Object)
    );

    service.generateTrip({ prompt: 'Weekend trip' });
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/ai-trip',
      { prompt: 'Weekend trip' },
      jasmine.any(Object)
    );
  });
});
