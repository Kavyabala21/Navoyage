import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
@Component({
  selector: 'app-vehicle-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'reviews.html'
})
export class Reviews implements OnInit {

  vehicleId!: number;
  bookingId!: number;

  rating = 0;
  comments = '';
  editingReviewId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    public facade: DataFacade,
    private toastr: ToastrService,
    private router:Router
    
  ) {}

  /* ---------------- INIT ---------------- */

  ngOnInit(): void {
    this.vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId'));
    this.bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId'));

    if (!this.vehicleId) {
      this.toastr.error('Vehicle not found for reviews');
      return;
    }

    this.loadData();
  }

  private loadData(): void {
    this.facade.loadReviewsByVehicle(this.vehicleId);
    this.facade.loadAverageRating(this.vehicleId);
    this.facade.loadMyReviews();
  }

  /* ---------------- GETTERS (NO SUBSCRIPTIONS) ---------------- */

  get reviews() {
    return this.facade.reviews$.value || [];
  }

  get myReviews() {
    return this.facade.myReviews$.value || [];
  }

  get averageRating() {
    return this.facade.averageRating$.value || 0;
  }

  isMyReview(reviewId: number): boolean {
    return this.myReviews.some(r => r.reviewId === reviewId);
  }

  /* ---------------- STAR UI ---------------- */

  setRating(value: number): void {
    this.rating = value;
  }

  isFilledStar(index: number): boolean {
    return index <= this.rating;
  }

  starArray(count = 5): number[] {
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  /* ---------------- ADD / UPDATE ---------------- */

  submitReview(): void {
    if (!this.rating) {
      this.toastr.warning('Please select a rating');
      return;
    }

    const payload = {
      bookingId: this.bookingId,
      vehicleId: this.vehicleId,
      rating: this.rating,
      comments: this.comments
    };
    if (this.editingReviewId) {
      this.facade.updateReview(this.editingReviewId, payload);
      this.toastr.success('Review updated');
    } else {
      this.facade.addReview(payload);
      this.router.navigate(['/bookings']);
    }

    this.resetForm();
    this.loadData();
  }

  editReview(review: any): void {
    this.editingReviewId = review.reviewId;
    this.rating = review.rating;
    this.comments = review.comments || '';
  }

  deleteReview(reviewId: number): void {
    if (!confirm('Delete this review?')) return;

    this.facade.deleteReview(reviewId);
    this.toastr.success('Review deleted');
    this.loadData();
  }

  resetForm(): void {
    this.rating = 0;
    this.comments = '';
    this.editingReviewId = null;
  }
}
