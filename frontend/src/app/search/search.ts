import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { AuthSignal } from '../core/auth/auth-signal';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.html',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class Search implements OnInit {

  transportMode!: string | null;

  allInstances: any[] = [];
  filteredInstances: any[] = [];
  stops: any[] = [];

  backendUrl = environment.backendBaseUrl;

  /* USER */
  username: string | null = null;
  role: string | null = null;
  isLoggedIn = false;
  isLoading = false;

  /* SEARCH INPUTS */
  fromLocationName = '';
  toLocationName = '';
  departureDateFilter = '';
  minDate: string = '';

  /* SEARCH STATE */
  noSearchResults = false;
  searchedFrom = '';
  searchedTo = '';
  searchedDate = '';

  /* FILTERS */
  filterDate = '';
  minPrice = 0;
  maxPrice = 10000;
  minSeats = 1;
  seatType = '';
  seatDeck = '';
  seatPosition = '';
  sortBy = '';
  search = false;
  distance: number = 1;
  priceErrorMessage: string = '';
  noFilterResults = false;

  /* REVIEWS */
  selectedInstanceId: number | null = null;
  selectedVehicleReviews: any[] = [];
  selectedVehicleName = '';
  loadingReviews = false;
  showReviews = false;
  minPriceError = false;
  maxPriceError = false;
  priceRangeError = false;

  /* CACHE */
  private vehicleRatingCache = new Map<number, number>();

  /* LEAFLET MAP */
  map: any;

  constructor(
    private facade: DataFacade,
    private api: Api_Calls,
    private router: Router,
    private authSignal: AuthSignal,
    private toastr: ToastrService
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.transportMode = sessionStorage.getItem('transportMode');

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    if (!this.transportMode) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUser();
    this.facade.loadAllStops();

    this.fromLocationName = sessionStorage.getItem('fromPlace') || '';
    this.toLocationName = sessionStorage.getItem('toPlace') || '';
    this.departureDateFilter = sessionStorage.getItem('departureDate') || '';

    const departureDate = sessionStorage.getItem('departureDate');
    const fromStopId = Number(sessionStorage.getItem('fromStopId'));
    const toStopId = Number(sessionStorage.getItem('toStopId'));

    if (fromStopId && toStopId) {
      this.calculateDistance(fromStopId, toStopId);
    }

    this.search = true;

    if (fromStopId && toStopId && departureDate) {

      this.search = false;
      this.isLoading = true;

      this.facade.searchVehicleInstances(
        fromStopId,
        toStopId,
        departureDate
      );

      this.searchedFrom = this.fromLocationName;
      this.searchedTo = this.toLocationName;
      this.searchedDate = departureDate;
    }

    this.facade.vehicleInstances$.subscribe(instances => {

      if (!instances) return;

      this.prepareInstances(instances);

      this.isLoading = false;
      this.noSearchResults = this.filteredInstances.length === 0;
    });

    this.facade.stops$.subscribe((stops:any) => {
      this.stops = stops || [];
    });

    /* SAFE MAP RESIZE (FIX FOR UNIT TEST ERROR) */
    setTimeout(() => {
      const map: any = this.map;

      if (map && typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
    }, 200);
  }
  applyFilters(): void {

    if (this.minPrice > this.maxPrice) {
      this.priceRangeError = true;
      return;
    }

    this.priceRangeError = false;

    this.filteredInstances = this.allInstances.filter(i => {

      const price = i.calculatedPrice ?? i.minSeatPrice ?? 0;

      /* PRICE FILTER */
      if (this.minPrice && price < this.minPrice) return false;
      if (this.maxPrice && price > this.maxPrice) return false;

      /* SEAT COUNT */
      if (this.minSeats && i.availableSeats < this.minSeats) return false;

      /* DATE FILTER */
      if (this.filterDate) {
        const instanceDate = i.departureDate?.substring(0, 10);
        if (instanceDate !== this.filterDate) return false;
      }

      /* If seatMeta not loaded yet → don't block results */
      if (!i.seatMeta) return true;

      /* ================= TRAIN ================= */
      if (this.transportMode === 'Train') {

        if (this.seatType) {
          const match = i.seatMeta.some((s: any) => s.type === this.seatType);
          if (!match) return false;
        }

        return true;
      }

      /* ================= BUS / FLIGHT ================= */

      if (this.seatType) {
        const match = i.seatMeta.some((s: any) =>
          s.type === this.seatType || s.SeatType === this.seatType
        );
        if (!match) return false;
      }

      if (this.seatDeck) {
        const match = i.seatMeta.some((s: any) =>
          s.deck === this.seatDeck || s.Deck === this.seatDeck
        );
        if (!match) return false;
      }

      if (this.seatPosition) {
        const match = i.seatMeta.some((s: any) =>
          s.position === this.seatPosition || s.Position === this.seatPosition
        );
        if (!match) return false;
      }

      return true;

    });

    this.sortResults();

    this.noFilterResults = this.filteredInstances.length === 0;
  }
  resetFilters(): void {

    this.filterDate = '';
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.minSeats = 1;
    this.seatType = '';
    this.seatDeck = '';
    this.seatPosition = '';
    this.sortBy = '';

    this.filteredInstances = [...this.allInstances];

    this.noFilterResults = false;
  } private sortResults(): void {

    if (!this.sortBy) return;

    if (this.sortBy === 'price') {

      this.filteredInstances.sort((a, b) =>
        (a.calculatedPrice ?? a.minSeatPrice) -
        (b.calculatedPrice ?? b.minSeatPrice)
      );

    }

    if (this.sortBy === 'departure') {

      this.filteredInstances.sort((a, b) =>
        new Date(a.departureDate + ' ' + a.departureTime).getTime() -
        new Date(b.departureDate + ' ' + b.departureTime).getTime()
      );

    }
  } searchByLocations(): void {

    const fromStop = this.stops.find(s => s.stopName === this.fromLocationName);
    const toStop = this.stops.find(s => s.stopName === this.toLocationName);

    if (!fromStop || !toStop || !this.departureDateFilter) {

      this.toastr.error('Please select From, To and Date');
      return;
    }

    this.isLoading = true;
    this.search = false;

    this.facade.searchVehicleInstances(
      fromStop.stopId,
      toStop.stopId,
      this.departureDateFilter
    );

    this.calculateDistance(fromStop.stopId, toStop.stopId);
    console.log(this.distance);
    this.searchedFrom = this.fromLocationName;
    this.searchedTo = this.toLocationName;
    this.searchedDate = this.departureDateFilter;

  }
  openReviews(instance: any): void {

    /* TOGGLE SAME CARD */
    if (this.selectedInstanceId === instance.instanceId && this.showReviews) {
      this.showReviews = false;
      return;
    }

    this.selectedInstanceId = instance.instanceId;
    this.selectedVehicleName = instance.vehicle?.vehicleCode ?? '';

    this.showReviews = true;
    this.loadingReviews = true;

    this.api.getReviewsByVehicle(instance.vehicleId).subscribe({

      next: (res: any) => {
        this.selectedVehicleReviews = res?.data ?? [];
        instance.reviewCount = this.selectedVehicleReviews.length;
        this.loadingReviews = false;
      },

      error: () => {
        this.selectedVehicleReviews = [];
        this.loadingReviews = false;
        this.toastr.error('Unable to load reviews');
      }

    });
  }
  closeReviews(): void {
    this.showReviews = false;
    this.selectedInstanceId = null;
  }
  /* ================= USER ================= */

  loadUser(): void {

    const user = this.authSignal.user();

    this.username = user?.name ?? null;
    this.role = user?.role ?? null;
    this.isLoggedIn = user?.isLoggedIn ?? false;
  }

  /* ================= HELPERS ================= */

  private isFutureInstance(i: any): boolean {

    const datePart = i?.departureDate?.substring(0, 10);
    if (!datePart || !i.departureTime) return false;

    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min] = i.departureTime.split(':').map(Number);

    return Date.UTC(y, m - 1, d, h, min) > Date.now();
  }

  private prepareInstances(instances: any[]): void {

    this.allInstances = instances.filter(i =>
      i.vehicle?.modeOfTransport === this.transportMode &&
      i.isActive &&
      this.isFutureInstance(i)
    );

    this.attachSeatPrices();
    this.attachVehicleRatings();

    this.filteredInstances = [...this.allInstances];
  }

  calculateDistance(startId: number, destinationId: number) {

    this.api.distance(startId, destinationId).subscribe({
      next: (res: any) => {

        if (res?.status) {

          this.distance = res.data ?? 0;
          console.log(this.distance);
          sessionStorage.setItem('distance', this.distance.toString());
          this.updatePrices();
        }
      }
    });
  }

  private updatePrices(): void {

    this.allInstances.forEach(instance => {

      if (!instance.minSeatPrice) return;

      instance.calculatedPrice =
        instance.minSeatPrice * this.distance;

    });

    this.filteredInstances = [...this.allInstances];
  }

  /* ================= SEAT PRICE ================= */

  private attachSeatPrices(): void {

    this.allInstances.forEach(instance => {

      this.api.getSeatLayoutByVehicleId(instance.vehicleId).subscribe({

        next: (res: any) => {

          const layout = res?.data ?? res;
          if (!layout?.layoutJSON) return;

          const parsed = JSON.parse(layout.layoutJSON);

          /* TRAIN */
          if (parsed.transportMode === 'TRAIN' && parsed.trainSeats) {

            instance.seatMeta = parsed.trainSeats;

            const minPrice = Math.min(
              ...parsed.trainSeats.map((s: any) => s.BasePrice)
            );

            instance.minSeatPrice = minPrice;

            if (this.distance > 0) {
              instance.calculatedPrice =
                Math.ceil(minPrice * this.distance);
            }

          }

          /* BUS / FLIGHT */
          else if (parsed.seats) {

            instance.seatMeta = parsed.seats;

            const minPrice = Math.min(
              ...parsed.seats.map((s: any) => s.BasePrice)
            );

            instance.minSeatPrice = minPrice;

            if (this.distance > 0) {
              instance.calculatedPrice =
                Math.ceil(minPrice * this.distance);
            }

          }

        }

      });

    });

  }
  /* ================= VEHICLE RATING ================= */

  private attachVehicleRatings(): void {

    const uniqueVehicleIds = Array.from(
      new Set(this.allInstances.map(i => i.vehicleId))
    );

    uniqueVehicleIds.forEach(vehicleId => {

      if (this.vehicleRatingCache.has(vehicleId)) {

        const cached = this.vehicleRatingCache.get(vehicleId)!;
        this.applyRatingToInstances(vehicleId, cached);
        return;
      }

      this.api.getAverageRating(vehicleId).subscribe({

        next: (res: any) => {

          const rating = (res?.data ?? 0).toFixed(2);
          this.vehicleRatingCache.set(vehicleId, rating);
          this.applyRatingToInstances(vehicleId, rating);
        },

        error: () => {

          this.vehicleRatingCache.set(vehicleId, 0);
          this.applyRatingToInstances(vehicleId, 0);
        }
      });
    });
  }

  private applyRatingToInstances(vehicleId: number, rating: number): void {

    this.allInstances
      .filter(i => i.vehicleId === vehicleId)
      .forEach(i => i.avgRating = rating);
  }

  /* ================= NAVIGATION ================= */

  goToSeatLayout(vehicleId: number, instanceId: number): void {
    this.router.navigate(['/bookingseatlayout', vehicleId, instanceId]);
  }

  goToLogin(): void {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/login']);
  }

  goBack(): void {

    sessionStorage.removeItem('transportMode');
    sessionStorage.removeItem('fromStopId');
    sessionStorage.removeItem('toStopId');
    sessionStorage.removeItem('fromPlace');
    sessionStorage.removeItem('toPlace');
    sessionStorage.removeItem('departureDate');

    this.router.navigate(['/dashboard']);
  }
}
