import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PassengerForm } from '../passenger-form/passenger-form';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { FormsModule } from '@angular/forms';

/* Restrict gender values strictly */
type Gender = 'Male' | 'Female';

/* Structure of each seat in layout */
interface Seat {
  seatNo: string;
  row: number;
  column: number;
  type: 'SEATER' | 'SLEEPER';
  deck: 'LOWER' | 'UPPER';
  position: string;
  BasePrice: number;
  price?: number;   // add this line
}

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  templateUrl: 'booking-seat-layout.html',
  imports: [PassengerForm, CommonModule, FormsModule]
})
export class BookingSeatLayout implements OnInit {

  /* Route parameters */
  vehicleId!: number;
  instanceId!: number;

  map: any = {
    invalidateSize: () => { }
  };

  /* Layout and seat data */
  layout: any;
  seats: Seat[] = [];
  selectedSeats: Seat[] = [];
  aisleColumns: number[] = [];
  trainPassengerCount = 1;
  selectedCoach: any = null;
  trainSeats: any[] = [];

  /* Booking tracking */
  bookings: any[] = [];
  bookedSeatMap: { [seatNo: string]: Gender } = {};
  distance = Number(sessionStorage.getItem('distance'));
  /* UI states */
  loading = true;
  errorMsg = '';
  showPassengerForm = false;

  /* Maximum seats allowed per booking */
  maxSeats = 6;
  constructor(
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private api: Api_Calls
  ) { }

  ngOnInit(): void {
    this.vehicleId = Number(this.route.snapshot.paramMap.get('vehicleId'));
    this.instanceId = Number(this.route.snapshot.paramMap.get('instanceId'));

    this.fetchSeatLayout();
    this.loadBookings();
  }

  get isTrain(): boolean {
    return this.layout?.transportMode === 'TRAIN';
  }

  /* ---------------- LOAD BOOKINGS ---------------- */

  loadBookings() {

    this.bookedSeatMap = {};

    this.api.getBookingsByInstanceId(this.instanceId).subscribe({
      next: (res) => {

        const bookings = res?.data || [];
        if (!bookings.length) return;

        bookings.forEach((booking: any) => {

          this.api.getPassengers(booking.bookingId).subscribe({
            next: (pRes) => {

              const passengers = pRes?.data || [];

              passengers.forEach((p: any) => {

                const seatNo = p.seatNumber;
                const genderRaw = p.gender;

                if (!seatNo || !genderRaw) return;

                const gender = genderRaw.toString().toLowerCase();

                if (gender === 'male') {
                  this.bookedSeatMap[seatNo] = 'Male';
                }
                else if (gender === 'female') {
                  this.bookedSeatMap[seatNo] = 'Female';
                }

              });

              console.log('Updated bookedSeatMap:', this.bookedSeatMap);

            },
            error: (err) => {
              console.error('Failed to load passengers for booking', booking.bookingId, err);
            }
          });

        });

      },
      error: (err) => {
        console.error('Failed to load bookings', err);
      }
    });
  }

  /* ---------------- SEAT LAYOUT ---------------- */

  fetchSeatLayout() {

    this.loading = true;

    this.api.getSeatLayoutByVehicleId(this.vehicleId).subscribe({
      next: (res: any) => {

        if (!res?.data?.layoutJSON) {
          this.errorMsg = 'Seat layout not available';
          this.loading = false;
          return;
        }

        try {

          const parsed = JSON.parse(res.data.layoutJSON);
          this.layout = parsed;

          if (parsed.transportMode === 'TRAIN') {
            this.trainSeats = parsed.trainSeats || [];
          } else {

            this.seats = parsed.seats || [];

            if (parsed.transportMode === 'FLIGHT') {
              this.aisleColumns = parsed.aisleColumns || [];
            }
          }

        } catch {
          this.errorMsg = 'Seat layout not available';
        }

        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load seat layout';
        this.loading = false;
      }
    });
  }

  selectCoach(coach: any) {
    this.selectedCoach = coach;
  }

  /* ---------------- SEAT LOGIC ---------------- */

  get lowerDeckSeats() {
    return this.seats.filter(s => s.deck === 'LOWER');
  }

  get upperDeckSeats() {
    return this.seats.filter(s => s.deck === 'UPPER');
  }

  toggleSeat(seat: Seat) {

    if (this.isBooked(seat)) {
      this.toastr.error('This seat is already booked');
      return;
    }

    if (this.isSelected(seat)) {
      this.selectedSeats =
        this.selectedSeats.filter(s => s.seatNo !== seat.seatNo);
      return;
    }

    if (this.selectedSeats.length >= this.maxSeats) {
      this.toastr.warning('Maximum 6 seats allowed');
      return;
    }

    const adjacentGender = this.getAdjacentBookedGender(seat);

    if (adjacentGender) {

      const confirmResult = confirm(
        `Adjacent seat is booked by ${adjacentGender} Gender.
        This seat must also be booked for ${adjacentGender}.
        Do you want to continue?`
      );

      if (!confirmResult) return;

      (seat as any).restrictedGender = adjacentGender;
    }

    const calculatedPrice = seat.BasePrice * this.distance;

    this.selectedSeats.push({
      ...seat,
      price: calculatedPrice
    });
  }

  getSeatClasses(s: Seat) {
    return {
      seater: s.type === 'SEATER',
      sleeper: s.type === 'SLEEPER',
      window: s.position === 'WINDOW',
      upper: s.deck === 'UPPER',
      selected: this.isSelected(s),
      booked: this.isBooked(s),
      male: this.isBooked(s) && this.getBookedGender(s) === 'Male',
      female: this.isBooked(s) && this.getBookedGender(s) === 'Female'
    };
  }

  isSelected(seat: Seat): boolean {
    return this.selectedSeats.some(s => s.seatNo === seat.seatNo);
  }

  get selectedSeatNumbers(): string {
    return this.selectedSeats.length
      ? this.selectedSeats.map(s => s.seatNo).join(', ')
      : 'None';
  }

  /* ---------------- TOTAL PRICE ---------------- */

  get totalPrice(): number {

    /* TRAIN */
    if (this.isTrain && this.selectedCoach) {
      return Math.ceil(
        this.selectedCoach.BasePrice *
        this.distance *
        this.trainPassengerCount
      );
    }

    /* BUS / FLIGHT */
    return Math.ceil(
      this.selectedSeats.reduce(
        (sum, s) => sum + (s.BasePrice * this.distance),
        0
      )
    );
  }

  /* ---------------- PROCEED ---------------- */

  proceed() {

    if (this.isTrain) {

      if (!this.selectedCoach) {
        this.toastr.error('Please select a coach type');
        return;
      }

      if (this.trainPassengerCount < 1 || this.trainPassengerCount > 6) {
        this.toastr.error('Passengers must be between 1 and 6');
        return;
      }

      this.selectedSeats = [];

      for (let i = 1; i <= this.trainPassengerCount; i++) {
        const calculatedPrice = this.selectedCoach.BasePrice * this.distance;

        this.selectedSeats.push({
          seatNo: `${this.selectedCoach.type}-${i}`,
          BasePrice: this.selectedCoach.BasePrice,
          price: calculatedPrice
        } as any);
      }

      this.showPassengerForm = true;
      return;
    }

    if (!this.selectedSeats.length) {
      alert('Please select at least one seat');
      return;
    }

    this.showPassengerForm = true;
  }

  /* ---------------- GRID HELPERS ---------------- */

  get rowArray(): number[] {
    return Array.from({ length: this.layout?.rows || 0 }, (_, i) => i + 1);
  }

  get colArray(): number[] {
    return Array.from({ length: this.layout?.columns || 0 }, (_, i) => i + 1);
  }

  getGridColumns(): number {

    if (this.isFlight)
      return this.layout.columns + (this.aisleColumns?.length || 0);

    if (!this.layout?.aisleColumn)
      return this.layout?.columns || 0;

    return this.layout.columns + 1;
  }
  getGridPosition(column: number): number {

    if (this.isFlight) {

      let shift = 0;

      for (let a of this.aisleColumns)
        if (column > a) shift++;

      return column + shift;
    }

    if (this.aisleColumn && column > this.aisleColumn)
      return column + 1;

    return column;
  }
  getSeat(seats: any[], row: number, column: number): any | null {
    return seats.find(s => s.row === row && s.column === column) || null;
  }

  get isFlight(): boolean {
    return this.layout?.transportMode === 'FLIGHT';
  }

  get aisleColumn(): number | null {
    return this.layout?.aisleColumn ?? null;
  }

  seatClass(s: any) {
    return {
      seater: s.type === 'SEATER',
      sleeper: s.type === 'SLEEPER',
      window: s.position === 'WINDOW',
      upper: s.deck === 'UPPER'
    };
  }

  /* ---------------- BOOKING HELPERS ---------------- */

  isBooked(seat: Seat): boolean {
    return this.bookedSeatMap.hasOwnProperty(seat.seatNo);
  }

  getBookedGender(seat: Seat): Gender | null {
    return this.bookedSeatMap[seat.seatNo] || null;
  }

  private getAdjacentSeat(seat: Seat): Seat | null {

    const adjacentCandidates = this.seats.filter(s =>
      s.row === seat.row &&
      s.deck === seat.deck &&
      Math.abs(s.column - seat.column) === 1
    );

    if (!adjacentCandidates.length) return null;

    if (!this.layout?.aisleColumn) {
      return adjacentCandidates[0];
    }

    const aisle = this.layout.aisleColumn;
    const adjacent = adjacentCandidates[0];

    const isAcrossAisle =
      (seat.column <= aisle && adjacent.column > aisle) ||
      (seat.column > aisle && adjacent.column <= aisle);

    if (isAcrossAisle) return null;

    return adjacent;
  }

  private getAdjacentBookedGender(seat: Seat): Gender | null {

    const adjacent = this.getAdjacentSeat(seat);
    if (!adjacent) return null;

    if (this.isBooked(adjacent)) {
      return this.getBookedGender(adjacent);
    }

    return null;
  }

}