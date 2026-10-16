import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})

export class Api_Calls {

  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(isFormData: boolean = false) {

    const token = sessionStorage.getItem('token');

    if (isFormData) {
      return {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      };
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }
  /*========================= Bookings ===============*/
  bookings(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Booking/GetAll`, this.getHeaders());
  }
  createBooking(payload: any) {
    return this.http.post(
      `${this.baseUrl}/Booking/CreateBooking`,
      payload,
      this.getHeaders()
    );
  }
  getTravelCompanyBookings(){
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Booking/GetBookingsByTravelCompany`, this.getHeaders());

  }
  getMyBookings(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Booking/MyBookings`, this.getHeaders());
  }
  getBookingsByInstanceId(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/Booking/GetBookingsByInstanceId?instanceId=${id}`,
      this.getHeaders()
    );
  }
getByPNR(pnr: string) {
  return this.http.get(`${this.baseUrl}/Booking/GetByPNR?PNR=${pnr}`);
}
  cancelBooking(bookingId: number) {
    return this.http.put(`${this.baseUrl}/Booking/Cancel/${bookingId}`, {}, this.getHeaders());
  }

  cancelPassenger(passengerId: number) {
    return this.http.put(`${this.baseUrl}/Passenger/CancelBookingForPassenger/${passengerId}`, {}, this.getHeaders());
  }
getTotalBookings(){
  return this.http.get(`${this.baseUrl}/Booking/TotalBookingsCount`,this.getHeaders());
}
  /*======================= PASSENGERS ============================*/
  getPassengers(bookingId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Passenger/PassengersByBookingId/${bookingId}`, this.getHeaders());
  }

  /* ===================== USER ===================== */
  login(data: any) {
    return this.http.post(`${this.baseUrl}/User/Login`, data);
  }

  register(user: any) {
    return this.http.post(`${this.baseUrl}/User/AddUser`, user);
  }
  getUserById(id: number) {
    return this.http.get(`${this.baseUrl}/User/GetUserById/${id}`, this.getHeaders());
  }
  getMyProfile() {
    return this.http.get(`${this.baseUrl}/User/GetMyProfile`, this.getHeaders());
  }
  getUsers() {
    return this.http.get(`${this.baseUrl}/User/GetAllUsers`, this.getHeaders());
  }

  updateUser(payload: any) {
    // Backend will take userId from token
    return this.http.put(`${this.baseUrl}/User/UpdateUser/${payload.userId}`, payload, this.getHeaders());
  }

  /*==================== Vehicles ===================================*/
  getAllVehicles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Vehicle/GetAllVehicles`, this.getHeaders());
  }
  addVehicle(vehicle: any) {
    return this.http.post(
      `${this.baseUrl}/Vehicle/AddVehicle`,
      vehicle,
      this.getHeaders(true)   // IMPORTANT
    );
  }
  getVehiclesByTravelCompany(TravelCompanyId: number) {
    return this.http.get(`${this.baseUrl}/Vehicle/GetVehicleByCompanyId/${TravelCompanyId}`, this.getHeaders());
  }
  getVehicleById(vehicleId: number) {
    return this.http.get(
      `${this.baseUrl}/Vehicle/GetVehicleById/${vehicleId}`, this.getHeaders());
  }
  updateVehicle(vehicleId: number, data: FormData) {
    return this.http.put(
      `${this.baseUrl}/Vehicle/UpdateVehicle/${vehicleId}`, data, this.getHeaders(true));
  }

  deactivateVehicle(vehicleId: number) {
    return this.http.put(`${this.baseUrl}/Vehicle/DeactivateVehicle/${vehicleId}`, {}, this.getHeaders());
  }
  /* ================= VEHICLE DOCUMENTS ================= */

  uploadVehicleDocument(vehicledocument: any) {
    return this.http.post(
      `${this.baseUrl}/VehicleDocument/UploadVehicleDocuments`,
      vehicledocument,
      this.getHeaders(true)
    );
  }
  getDocumentsByVehicle(vehicleId: number) {
    return this.http.get(
      `${this.baseUrl}/VehicleDocument/GetDocumentsByVehicleId/${vehicleId}`, this.getHeaders());
  }
  updateVehicleDocument(documentId: number, data: FormData) {
    return this.http.put(
      `${this.baseUrl}/VehicleDocument/UpdateDocument/${documentId}`, data, this.getHeaders(true));
  }

  /* ===================== VEHICLE DOCUMENTS (ADMIN) ===================== */

  getAllVehicleDocuments() {
    return this.http.get(
      `${this.baseUrl}/VehicleDocument/GetAllDocuments`,
      this.getHeaders()
    );
  }

  approveOrRejectDocument(
    documentId: number,
    status: 'Approved' | 'Rejected',
    vehicleCondition: string,
    remarks: string
  ) {
    return this.http.put(
      `${this.baseUrl}/VehicleDocument/ApproveOrRejectDocument/${documentId}`,
      null,
      {
        ...this.getHeaders(),
        params: {
          status,
          vehicleCondition,
          remarks
        }
      }
    );
  }


  downloadVehicleDocument(documentId: number) {
    return this.http.get(
      `${this.baseUrl}/VehicleDocument/DownloadDocument/${documentId}`,
      {
        ...this.getHeaders(),
        responseType: 'blob'
      }
    );
  }

  /*================= Vehicle Instances =============================*/
  getAllVehicleInstance() {
    return this.http.get(`${this.baseUrl}/VehicleInstance/GetAllVehicleInstances`, this.getHeaders());
  }

  updateVehicleInstance(payload: any) {
    return this.http.put(
      `${this.baseUrl}/VehicleInstance/Update`,
      payload,
      this.getHeaders()
    );
  }
searchVehicleInstances(startId: number, endId: number, date: string) {
  return this.http.get(
    `${this.baseUrl}/VehicleInstance/Search?startId=${startId}&endId=${endId}&departureDate=${date}`
  );
}
  addVehicleInstance(payload: any) {
    return this.http.post(
      `${this.baseUrl}/VehicleInstance/Add`,
      payload,
      this.getHeaders());
  }
  getVehicleInstanceById(instanceId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/VehicleInstance/GetById/${instanceId}`,
      this.getHeaders()
    );
  }
  getVehicleInstanceByVehicleId(vehicleId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/VehicleInstance/GetVehicleInstanceByVehicleId/${vehicleId}`,
      this.getHeaders()
    );
  }
  deleteVehicleInstance(instanceId: number) {
    return this.http.put(
      `${this.baseUrl}/VehicleInstance/DeleteVehicleInstance/${instanceId}`,
      {},
      this.getHeaders()
    );
  }
  cancleVehiclInstance(instanceId:number){
    return this.http.put(`${this.baseUrl}/VehicleInstance/CancelVehicleInstance/${instanceId}`,
      {},
      this.getHeaders());
  }
  /*=============================== Routes ==================================*/

  // Get all routes
  getRoutes(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/Routes/GetAllRoutes`,
      this.getHeaders()
    );
  }

  // Get route by id
  getRouteById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/Routes/GetRouteById/${id}`,
      this.getHeaders()
    );
  }
  getRoutesByOwnerId(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/Routes/GetRouteByOwnerId`,
      this.getHeaders()
    );
  }


  // Add route
  addRoute(payload: {
    routeName: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Routes/AddRoute`,
      payload,
      this.getHeaders()
    );
  }

  // Update route
  updateRoute(payload: {
    routeId: number;
    routeName: string;
  }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/Routes/UpdateRoute`,
      payload,
      this.getHeaders()
    );
  }

  // Delete route
  deleteRoute(routeId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/Routes/DeleteRoute/${routeId}`,
      {},
      this.getHeaders()
    );
  }

  // Get routes by from-to
  getRoutesByFromTo(fromStopId: number, toStopId: number) {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/Routes/GetRouteByFromToLocations`,
      {
        ...this.getHeaders(),
        params: {
          fromStopId,
          toStopId
        }
      }
    );
  }

  /*=========================Route Stop points ======================*/
  // Get all route stop points
  getAllRouteStopPoints(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/RouteStopPoint/GetAll`,
      this.getHeaders()
    );
  }


  // Get by id
  getRouteStopPointById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/RouteStopPoint/GetById/${id}`,
      this.getHeaders()
    );
  }
  getRouteStopPointsByRouteId(routeId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/RouteStopPoint/GetRouteStopPointByRouteId/${routeId}`,
      this.getHeaders()
    );
  }

  // Add stop to route
  addRouteStopPoint(payload: {
    routeId: number;
    stopId: number;
    sequenceOrder: number;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/RouteStopPoint/Add`,
      payload,
      this.getHeaders()
    );
  }

  // Update stop sequence
  updateRouteStopPoint(payload: {
    routeStopPointId: number;
    routeId: number;
    stopId: number;
    sequenceOrder: number;
  }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/RouteStopPoint/Update`,
      payload,
      this.getHeaders()
    );
  }

  // Delete route stop point
  deleteRouteStopPoint(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/RouteStopPoint/Delete/${id}`,
      {},
      this.getHeaders()
    );
  }

  /*=======================Travel Company =============================*/
  getMyTravelCompany() {
    return this.http.get(`${this.baseUrl}/TravelCompany/GetMyCompany`, this.getHeaders());
  }
  getAllTravelCompanies() {
    return this.http.get(`${this.baseUrl}/TravelCompany/GetAllCompanies`, this.getHeaders());
  }


  // ============================== SEAT LAYOUT ==============================//
  getSeatLayoutByVehicleId(vehicleId: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/SeatLayout/GetSeatLayoutByVehicleId/${vehicleId}`,
      this.getHeaders()
    );
  }

  saveSeatLayout(payload: {
    vehicleId: number;
    layoutJSON: string;
  }) {
    return this.http.post(
      `${this.baseUrl}/SeatLayout/SaveSeatLayout`,
      payload,
      this.getHeaders()
    );
  }


  updateSeatLayout(vehicleId: number, layoutJSON: string) {
    return this.http.put(
      `${this.baseUrl}/SeatLayout/UpdateSeatLayout`,
      {
        vehicleId: vehicleId,
        layoutJSON: layoutJSON
      },
      this.getHeaders()
    );
  }

  updateSeatPrice(
    vehicleId: number,
    seatNo: string,
    price: number
  ) {
    return this.http.put(
      `${this.baseUrl}/SeatLayout/UpdateSeatPrice`,
      {
        vehicleId: vehicleId,
        seatNo: seatNo,
        price: price
      },
      this.getHeaders()
    );
  }
  /*==================== Notifications =======================*/
  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications/UnreadNotificationsCount`, this.getHeaders());
  }

  getMyNotifications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications/GetMyNotifications`, this.getHeaders());
  }
  getAllMyNotifications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications/GetAllMyNotifications`, this.getHeaders());
  }
  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/MarkAsRead/${id}`, {}, this.getHeaders());
  }

  //======================= DISTANCE ================
  distance(startId: number, destinationId: number) {

    return this.http.get<ApiResponse<number>>(
      `${this.baseUrl}/Distance/calculate?sourceStopId=${startId}&destinationStopId=${destinationId}`
    );
  }

  // ===================== REVIEWS =====================

  addReview(payload: any) {
    return this.http.post(
      `${this.baseUrl}/Review/AddReview`,
      payload,
      this.getHeaders()
    );
  }

  updateReview(reviewId: number, payload: any) {
    return this.http.put(
      `${this.baseUrl}/Review/UpdateReview/${reviewId}`,
      payload,
      this.getHeaders()
    );
  }

  deleteReview(reviewId: number) {
    return this.http.delete(
      `${this.baseUrl}/Review/DeleteReview/${reviewId}`,
      this.getHeaders()
    );
  }

  getReviewById(reviewId: number) {
    return this.http.get(
      `${this.baseUrl}/Review/GetReviewById/${reviewId}`,
      this.getHeaders()
    );
  }
  getMyReviews() {
    return this.http.get(
      `${this.baseUrl}/Review/GetMyReviews`,
      this.getHeaders()
    );
  }

  getReviewsByVehicle(vehicleId: number) {
    return this.http.get(
      `${this.baseUrl}/Review/GetReviewsByVehicle/${vehicleId}`
    );
  }
  getReviewsByBookig(bookingId: number) {
  return this.http.get<boolean>(
    `${this.baseUrl}/Review/GetReviewsByBooking/${bookingId}`
  );
}
  getAverageRating(vehicleId: number) {
    return this.http.get(
      `${this.baseUrl}/Review/Vehicle/${vehicleId}/AverageRating`
    );
  }

  /* ===================== STOPS ===================== */
  getAllStops(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/Stop`);
  }


  getStopById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/Stop/${id}`);
  }

  createStop(payload: {
    stopName: string;
    latitude: number;
    longitude: number;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/Stop`,
      payload,
      this.getHeaders()
    );
  }

  updateStop(
    id: number,
    payload: {
      stopName: string;
      latitude: number;
      longitude: number;
    }
  ): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/Stop/${id}`,
      payload,
      this.getHeaders()
    );
  }


  deleteStop(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/Stop/${id}`,
      this.getHeaders()
    );
  }

  //------------ Payments ----------------//
  createOrder(amount: number) {
  return this.http.post(`${this.baseUrl}/payment/create-order`, { amount },this.getHeaders());
}

verifyPayment(data: any) {
  return this.http.post(`${this.baseUrl}/payment/verify-payment`, data,this.getHeaders());
}
// cancelBookingWithRefund(bookingId: number) {
//   return this.http.post(`${this.baseUrl}/payment/cancel-booking/${bookingId}`, {},this.getHeaders());
// }

// ======================== AI integration calls =======================
generateTrip(data: any) {
  return this.http.post(`${this.baseUrl}/ai-trip`, data, this.getHeaders());
}

}
