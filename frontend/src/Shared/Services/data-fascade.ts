import { Injectable } from '@angular/core';
import { BehaviorSubject,Observable } from 'rxjs';
import { Api_Calls } from './api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthSignal } from '../../app/core/auth/auth-signal';

@Injectable({
  providedIn: 'root'
})

export class DataFacade {


  user: any[] = [];
  /* ===================== GLOBAL STATE ===================== */
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  /* ===================== DATA STORES ===================== */
users$ = new BehaviorSubject<any[] | null>(null);
  vehicles$ = new BehaviorSubject<any[]>([]);
  vehicleInstances$ = new BehaviorSubject<any[]>([]);
  vehicleDocuments$ = new BehaviorSubject<any[]>([]);
  bookings$ = new BehaviorSubject<any[]>([]);
  passengers$ = new BehaviorSubject<any[]>([]);
  notifications$ = new BehaviorSubject<any[]>([]);
  unreadCount$ = new BehaviorSubject<number>(0);
  routes$ = new BehaviorSubject<any[]>([]);
  stops$ = new BehaviorSubject<any[]>([]);
  reviews$ = new BehaviorSubject<any[]>([]);
  myReviews$ = new BehaviorSubject<any[]>([]);
  averageRating$ = new BehaviorSubject<number>(0);
  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router,
    private authSignal: AuthSignal
  ) { }

  /* ===================== HELPERS ===================== */


  private fail(message: string) {
    this.error$.next(message);
    this.toastr.error(message);
  }
  
  /* ===================== USER ===================== */

  loginUser(credentials: any) {
  this.loading$.next(true);

  this.api.login(credentials).subscribe({
    next: (res: any) => {

      if (res.status) {

        this.authSignal.setToken(res.data.token);

        this.authSignal.setUser({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          phoneNumber: res.data.phoneNumber,
          isLoggedIn: true,
          InLoginPage: false
        });

        this.toastr.success(`Welcome ${res.data.name}`, 'Login Successful');
        // Keep the login screen in its loading state until navigation starts.
        setTimeout(() => {
          this.loading$.next(false);
          this.router.navigate(['/dashboard']);
        }, 800);

      } else {
        this.loading$.next(false);
        this.toastr.error(res.Message || 'Invalid Credentials', 'Login Failed');
      }
    },

    error: (err) => {
      this.loading$.next(false);

      if (err.error?.Message) {
        this.toastr.error(err.error.Message, 'Login Failed');
      }
      else if (err.error?.message) {
        this.toastr.error(err.error.message, 'Login Failed');
      }
      else {
        this.toastr.error('Something went wrong. Please try again.', 'Login Failed');
      }

    }
  });
}
  


  registerUser(payload: any) {
    this.api.register(payload).subscribe({
      next: () => {
        this.toastr.success('Registration successful');
      },
      error: () => this.fail('Registration failed')
    });
  }
loadUserById(id: number) {
  return this.api.getUserById(id);
}

  loadUsers() {
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to load users')
    });
  }

  updateUser(payload: any) {
    this.api.updateUser(payload).subscribe({
      next: () => {
        this.toastr.success('Profile updated successfully');
      },
      error: () => this.fail('Failed to update profile')
    });
  }

  clearUserState() {
    this.users$.next([]);
  }
 restoreAuth(): Promise<void> {
  return new Promise(resolve => {
    this.authSignal.restoreFromStorage();
    resolve();
  });
}

   
  /* ===================== VEHICLES ===================== */

  loadAllVehicles() {
    this.api.getAllVehicles().subscribe({
      next: res => {
        this.vehicles$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load vehicles')
    });
  }

  loadVehiclesByCompany(companyId: number) {
    if (!companyId) return this.fail('Company not found');

    this.api.getVehiclesByTravelCompany(companyId).subscribe({
      next: (res: any) => {
        this.vehicles$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to load company vehicles')
    });
  }

  getVehicleById(vehicleId: number) {
    this.api.getVehicleById(vehicleId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? null;
        this.vehicles$.next(data ? [data] : []);
      },
      error: () => this.fail('Failed to load vehicle')
    });
  }

  addVehicle(payload: any) {
    this.api.addVehicle(payload).subscribe({
      next: () => {
        this.toastr.success('Vehicle added successfully');
      },
      error: () => this.fail('Failed to add vehicle')
    });
  }

  updateVehicle(vehicleId: number, data: FormData) {
    this.api.updateVehicle(vehicleId, data).subscribe({
      next: () => {
        this.toastr.success('Vehicle updated successfully');
      },
      error: () => this.fail('Failed to update vehicle')
    });
  }

  deactivateVehicle(vehicleId: number) {
    this.api.deactivateVehicle(vehicleId).subscribe({
      next: () => {
        this.toastr.success('Vehicle deactivated');
      },
      error: () => this.fail('Vehicle deactivation failed')
    });
  }

  loadVehicles(ownerId: number, mode: string) {
    if (!ownerId) return this.fail('Owner not found');

    this.api.getAllVehicles().subscribe({
      next: res => {
        const data = res?.data || [];
        this.vehicles$.next(
          data.filter((v: any) =>
            v.travelCompany?.ownerId === ownerId &&
            v.modeOfTransport === mode
          )
        );
      },
      error: () => this.fail('Failed to load vehicles')
    });
  }
  /* ===================== TRAVEL COMPANY ===================== */

 loadMyTravelCompany() {
  return this.api.getMyTravelCompany();
}

  loadAllTravelCompanies() {
    this.api.getAllTravelCompanies().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.users$.next(Array.isArray(data) ? data : []);
      },
      error: () => this.fail('Failed to load travel companies')
    });
  }

  /* ===================== VEHICLE DOCUMENTS ===================== */

  uploadVehicleDocument(payload: any) {
    this.api.uploadVehicleDocument(payload).subscribe({
      next: () => {
        this.toastr.success('Document uploaded successfully');

      },
      error: () => this.fail('Document upload failed')
    });
  }

  loadVehicleDocuments(vehicleId: number) {
    this.api.getDocumentsByVehicle(vehicleId).subscribe({
      next: (res: any) => {
        this.vehicleDocuments$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to load vehicle documents')
    });
  }

  updateVehicleDocument(documentId: number, data: FormData) {
    this.api.updateVehicleDocument(documentId, data).subscribe({
      next: () => {
        this.toastr.success('Document updated successfully');
      },
      error: () => this.fail('Failed to update document')
    });
  }
  /* ===================== VEHICLE DOCUMENTS (ADMIN) ===================== */

  loadAllVehicleDocuments() {
    this.api.getAllVehicleDocuments().subscribe({
      next: (res: any) => {
        this.vehicleDocuments$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to load all documents')
    });
  }

approveOrRejectVehicleDocument(
  documentId: number,
  status: 'Approved' | 'Rejected',
  vehicleCondition: string,
  remarks: string
): Observable<any> {
  return this.api.approveOrRejectDocument(
    documentId,
    status,
    vehicleCondition,
    remarks
  );
}


  /* ===================== VEHICLE INSTANCES ===================== */

  /* Load ALL vehicle instances (Admin / Owner use-case) */
  loadAllVehicleInstances() {
    this.api.getAllVehicleInstance().subscribe({
      next: (res: any) => {
        this.vehicleInstances$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to load vehicle instances')
    });
  }
  /* Load instances by VEHICLE ID */
  loadVehicleInstancesByVehicleId(vehicleId: number) {
    if (!vehicleId) return this.fail('Vehicle not found');

    this.api.getVehicleInstanceByVehicleId(vehicleId).subscribe({
      next: res => {
        this.vehicleInstances$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load vehicle instances')
    });
  }

  /* Load SINGLE vehicle instance by INSTANCE ID */
  loadVehicleInstanceById(instanceId: number) {
    if (!instanceId) return this.fail('Instance not found');

    this.api.getVehicleInstanceById(instanceId).subscribe({
      next: res => {
        const data = res?.data;
        this.vehicleInstances$.next(
          Array.isArray(data) ? data : data ? [data] : []
        );
      },
      error: () => this.fail('Failed to load vehicle instance')
    });
  }

  /* SEARCH vehicle instances (Dashboard / Search page) */
  searchVehicleInstances(startId: number, endId: number, departureDate: string) {
    if (!startId || !endId || !departureDate)
      return this.fail('Invalid search parameters');

    this.api.searchVehicleInstances(startId, endId, departureDate).subscribe({
      next: (res: any) => {
        this.vehicleInstances$.next(res?.data || res || []);
      },
      error: () => this.fail('Failed to search vehicle instances')
    });
  }

  /* ADD vehicle instance */
  addVehicleInstance(payload: any) {
    this.api.addVehicleInstance(payload).subscribe({
      next: () => {
        this.toastr.success('Vehicle instance added successfully');
      },
      error: () => this.fail('Failed to add vehicle instance')
    });
  }

  /* UPDATE vehicle instance */
  updateVehicleInstance(payload: any) {
    this.api.updateVehicleInstance(payload).subscribe({
      next: () => {
        this.toastr.success('Vehicle instance updated successfully');
      },
      error: () => this.fail('Failed to update vehicle instance')
    });
  }

  /* DELETE (Soft delete) vehicle instance */
  deleteVehicleInstance(instanceId: number) {
    if (!instanceId) return this.fail('Instance not found');

    this.api.deleteVehicleInstance(instanceId).subscribe({
      next: () => {
        this.toastr.success('Vehicle instance deleted');
        this.vehicleInstances$.next(
          this.vehicleInstances$.value.filter(
            (i: any) => i.instanceId !== instanceId
          )
        );
      },
      error: () => this.fail('Failed to delete vehicle instance')
    });
  }



  /* ===================== BOOKINGS ===================== */
  loadMyBookings() {
    this.api.getMyBookings().subscribe({
      next: res => {
        this.bookings$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load bookings')
    });
  }
  loadAllBookings() {
    this.api.bookings().subscribe({
      next: res => {
        this.bookings$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load all bookings')
    });
  }
  cancelPassenger(passengerId: number) {
    this.api.cancelPassenger(passengerId).subscribe({
      next: () => {
        this.toastr.success('Passenger cancelled successfully');
      },
      error: () => this.fail('Failed to cancel passenger')
    });
  }

  cancelBooking(bookingId: number) {
    this.api.cancelBooking(bookingId).subscribe({
      next: () => {
        this.toastr.success('Booking cancelled');
      },
      error: () => this.fail('Booking cancellation failed')
    });
  }

  loadPassengers(bookingId: number) {
    this.api.getPassengers(bookingId).subscribe({
      next: res => this.passengers$.next(res?.data || []),
      error: () => this.fail('Failed to load passengers')
    });
  }

  /* ===================== ROUTES===================== */
  loadRoutes() {
    this.api.getRoutes().subscribe({
      next: res => this.routes$.next(res?.data || []),
      error: () => this.fail('Failed to load routes')
    });
  }
  /* ===================== STOPS ===================== */

  /** Load ALL stops */
  loadAllStops() {
    this.api.getAllStops().subscribe({
      next: res => {
        this.stops$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load stops')
    });
  }

  /* ===================== ROUTE STOP POINTS ===================== */

  /** Load ALL route stop points */
  loadAllRouteStopPoints() {
    this.api.getAllRouteStopPoints().subscribe({
      next: (res: any) => {
        // Some APIs may not wrap response in ApiResponse
        const data = res?.data ?? res ?? [];
        this.stops$.next(data);
      },
      error: () => this.fail('Failed to load route stop points')
    });
  }

  /* ===================== SEAT LAYOUT ===================== */

  loadSeatLayout(vehicleId: number) {
    if (!vehicleId) return this.fail('Vehicle not found');

    this.api.getSeatLayoutByVehicleId(vehicleId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.vehicles$.next(data ? [data] : []);
      },
      error: () => this.fail('Failed to load seat layout')
    });
  }


  saveSeatLayout(payload: { vehicleId: number; layoutJSON: string }) {
    this.api.saveSeatLayout(payload).subscribe({
      next: () => {
        this.toastr.success('Seat layout saved');
      },
      error: () => this.fail('Failed to save seat layout')
    });
  }

  updateSeatLayout(vehicleId: number, layoutJSON: string) {
    this.api.updateSeatLayout(vehicleId, layoutJSON).subscribe({
      next: () => {
        this.toastr.success('Seat layout updated');
      },
      error: () => this.fail('Failed to update seat layout')
    });
  }

  updateSeatPrice(vehicleId: number, seatNo: string, price: number) {
    this.api.updateSeatPrice(vehicleId, seatNo, price).subscribe({
      next: () => {
        this.toastr.success('Seat price updated');
      },
      error: () => this.fail('Failed to update seat price')
    });
  }


  /* ===================== NOTIFICATIONS ===================== */
  loadUnreadCount() {
    this.api.getUnreadCount().subscribe({
      next: (res: any) => {
        this.unreadCount$.next(res?.data ?? 0);
      },
      error: () => {
        this.unreadCount$.next(0);
      }
    });
  }
  loadMyNotifications() {
    this.api.getMyNotifications().subscribe({
      next: (res: any) => {
        this.notifications$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load notifications')
    });
  }
  loadAllMyNotifications() {
    this.api.getAllMyNotifications().subscribe({
      next: (res: any) => {
        this.notifications$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load all notifications')
    });
  }

  markNotificationAsRead(notificationId: number) {
    this.api.markAsRead(notificationId).subscribe({
      next: () => {
        // Update local list
        const updated = this.notifications$.value.map(n =>
          n.notificationId === notificationId
            ? { ...n, isRead: true }
            : n
        );

        this.notifications$.next(updated);

        // Reduce unread count safely
        this.unreadCount$.next(
          Math.max(0, this.unreadCount$.value - 1)
        );
      },
      error: () => this.toastr.error('Failed to mark notification as read')
    });
  }
  /* ===================== REVIEWS ===================== */

  /* Get all reviews for a vehicle (PUBLIC) */
  loadReviewsByVehicle(vehicleId: number) {
    if (!vehicleId) return this.fail('Invalid vehicle');

    this.api.getReviewsByVehicle(vehicleId).subscribe({
      next: (res: any) => {
        this.reviews$.next(res?.data || []);
      },
      error: () => this.fail('Failed to load reviews')
    });
  }

  /* Get average rating for a vehicle (PUBLIC) */
  loadAverageRating(vehicleId: number) {
    if (!vehicleId) return this.fail('Invalid vehicle');

    this.api.getAverageRating(vehicleId).subscribe({
      next: (res: any) => {
        this.averageRating$.next(res?.data || 0);
      },
      error: () => this.averageRating$.next(0)
    });
  }

  /* Get logged-in user's reviews */
  loadMyReviews() {
    this.api.getMyReviews().subscribe({
      next: (res: any) => {
        this.myReviews$.next(res?.data || []);
      },
      error: () => this.myReviews$.next([])
    });
  }

  /* Add review */
  addReview(payload: any) {
    this.api.addReview(payload).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.toastr.success(res.message);
        } else {
          this.toastr.error(res.message);
        }
      },
      error: () => this.fail('Failed to add review')
    });
  }

  /* Update review */
  updateReview(reviewId: number, payload: any) {
    this.api.updateReview(reviewId, payload).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.toastr.success(res.message);
        } else {
          this.toastr.error(res.message);
        }
      },
      error: () => this.fail('Failed to update review')
    });
  }

  /* Delete review */
  deleteReview(reviewId: number) {
    this.api.deleteReview(reviewId).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.toastr.success(res.message);
        } else {
          this.toastr.error(res.message);
        }
      },
      error: () => this.fail('Failed to delete review')
    });
  }
}
