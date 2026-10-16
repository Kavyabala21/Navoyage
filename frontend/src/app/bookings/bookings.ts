import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from "@angular/material/tooltip";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltip],
  templateUrl: 'bookings.html'
})
export class Bookings implements OnInit {

  @ViewChild('ticketContent') ticketContent!: ElementRef;
activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
  bookings: any[] = [];
  filteredBookings: any[] = [];
  loading = true;
  showTicketModal = false;
  selectedTicket: any = null;

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  /* ---------------- LOAD BOOKINGS ---------------- */

  loadBookings() {
    this.loading = true;

    this.api.getMyBookings().subscribe({
      next: (res: any) => {

        // A user with no bookings is a valid empty state, not an error.
        this.bookings = Array.isArray(res?.data) ? res.data : [];
        this.filteredBookings = [];

        if (!this.bookings.length) {
          this.loading = false;
          return;
        }

        this.api.getMyReviews().subscribe({
          next: (reviewRes: any) => {

            const myReviews = reviewRes.data || [];

            this.bookings.forEach(b => {

              b.passengers = [];
              b.passengersLoading = true;
              b.tripStarted = false;

              const review = myReviews.find((r: any) => r.bookingId === b.bookingId);

              b.reviewCompleted = !!review;
              b.reviewId = review ? review.reviewId : null;

              /* LOAD PASSENGERS */
              this.api.getPassengers(b.bookingId).subscribe({
                next: pres => {
                  b.passengers = pres.data || [];
                  b.passengersLoading = false;
                },
                error: () => {
                  b.passengersLoading = false;
                }
              });

              /* LOAD INSTANCE */
              this.api.getVehicleInstanceById(b.instanceId).subscribe({
                next: (instRes: any) => {
                  const inst = instRes.data;
                  b.tripStarted = this.hasTripStartedOrCompleted(inst);
                  b.vehicleInstance = inst;
                  this.applyFilter();
                },
                error: () => {
                  b.tripStarted = false;
                }
              });

            });

            this.loading = false;
            this.applyFilter();
          },
          error: () => {
            this.toastr.error('Failed to load reviews');
            this.loading = false;
          }
        });
      },
      error: () => {
        this.bookings = [];
        this.filteredBookings = [];
        this.toastr.error('Failed to load bookings');
        this.loading = false;
      }
    });
  }

  /* ---------------- TRIP LOGIC ---------------- */

  private hasTripStartedOrCompleted(inst: any): boolean {
    if (!inst?.departureDate || !inst?.departureTime) return false;

    const datePart = inst.departureDate.split('T')[0];
    const timePart = inst.departureTime.split(':');

    const departureUtc = Date.UTC(
      Number(datePart.split('-')[0]),
      Number(datePart.split('-')[1]) - 1,
      Number(datePart.split('-')[2]),
      Number(timePart[0]),
      Number(timePart[1] || 0),
      Number(timePart[2] || 0)
    );

    const nowUtc = new Date();
    const nowIst = nowUtc.getTime() + (5.5 * 60 * 60 * 1000);

    return nowIst >= departureUtc;
  }

  /* ---------------- REVIEW ---------------- */

  goToReview(b: any): void {
    const bookingId = b?.bookingId;
    const vehicleId = b?.vehicleInstance?.vehicleId;

    if (!bookingId || !vehicleId) {
      this.toastr.error('Unable to open review. Missing booking or vehicle.');
      return;
    }

    this.router.navigate(['/reviews'], {
      queryParams: { bookingId, vehicleId }
    });
  }

  /* ---------------- CANCEL BOOKING ---------------- */

  cancelBooking(bookingId: number) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.api.cancelBooking(bookingId).subscribe({
      next: () => {
        this.toastr.success('Booking cancelled successfully. Refund processed.');
        this.loadBookings();
      },
      error: (err: any) => {
        this.toastr.error(err.error?.message || 'Cancellation failed');
      }
    });
  }

  /* ---------------- HELPERS ---------------- */

  toggleSelectAll(booking: any, event: any) {
    const checked = event.target.checked;
    booking.passengers.forEach((p: any) => {
      if (p.status === 'Confirmed') p.selected = checked;
    });
  }

  hasSelectedPassengers(booking: any): boolean {
    if (!booking?.passengers?.length) return false;
    return booking.passengers.some((p: any) => p.selected);
  }

  /* ---------------- SMART PASSENGER CANCEL ---------------- */

  cancelSelectedPassengers(booking: any) {

    const selectedPassengers = booking.passengers.filter(
      (p: any) => p.selected && p.status === 'Confirmed'
    );

    if (!selectedPassengers.length) {
      this.toastr.warning('Please select at least one passenger');
      return;
    }

    const confirmedPassengers = booking.passengers.filter(
      (p: any) => p.status === 'Confirmed'
    );

    /* if all selected - cancel full booking */
    if (selectedPassengers.length === confirmedPassengers.length) {
      if (!confirm('All passengers selected. Cancel entire booking?')) return;

      this.cancelBooking(booking.bookingId);
      return;
    }

    if (!confirm(`Cancel ${selectedPassengers.length} passenger(s)?`)) return;

    let completed = 0;

    selectedPassengers.forEach((p: any) => {
      this.api.cancelPassenger(p.passengerId).subscribe({
        next: () => {
          completed++;

          if (completed === selectedPassengers.length) {
            this.toastr.success(`${completed} passenger(s) cancelled. Partial refund processed.`);
            this.loadBookings();
          }
        },
        error: () => {
          this.toastr.error('Failed to cancel one or more passengers');
        }
      });
    });
  }

  /* ---------------- REVIEW DELETE ---------------- */

  deleteReview(reviewId: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.api.deleteReview(reviewId).subscribe({
      next: () => {
        this.toastr.success('Review deleted');
        this.loadBookings();
      },
      error: () => {
        this.toastr.error('Failed to delete review');
      }
    });
  }

  /* ---------------- CONDITIONS ---------------- */

  canCancelBooking(booking: any): boolean {
    if (!booking) return false;
    return booking.status === 'Confirmed' && !booking.tripStarted;
  }

  canRateNow(b: any): boolean {
    return b.status !== 'Cancelled' && b.tripStarted;
  }

  /* ---------------- TICKET ---------------- */

  openTicketModal(booking: any) {
    this.selectedTicket = {
      ...booking,
      passengers: booking.passengers
    };
    this.showTicketModal = true;
  }

  closeTicketModal() {
    this.showTicketModal = false;
    this.selectedTicket = null;
  }

  downloadTicket() {

    if (!this.ticketContent) {
      this.toastr.error('Ticket not ready');
      return;
    }

    const element = this.ticketContent.nativeElement;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
      .then(canvas => {

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`ticket-${this.selectedTicket?.pnr}.pdf`);

      })
      .catch(err => {
        console.error(err);
        this.toastr.error('Failed to download ticket');
      });
  }
setTab(tab: 'upcoming' | 'completed' | 'cancelled') {
  this.activeTab = tab;
  this.applyFilter();
}
applyFilter() {
  if (!this.bookings) return;

  if (this.activeTab === 'cancelled') {
    this.filteredBookings = this.bookings.filter(b => b.status === 'Cancelled');
  }
  else if (this.activeTab === 'completed') {
    this.filteredBookings = this.bookings.filter(
      b => b.status !== 'Cancelled' && b.tripStarted
    );
  }
  else {
    // NOT COMPLETED (default)
    this.filteredBookings = this.bookings.filter(
      b => b.status !== 'Cancelled' && !b.tripStarted
    );
  }
}
  gotohome() {
    this.router.navigate(['/dashboard']);
  }
}
