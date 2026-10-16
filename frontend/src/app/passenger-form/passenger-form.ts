import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './passenger-form.html'
})
export class PassengerForm implements OnInit {

  @Input() selectedSeats: any[] = [];
  @Input() instanceId!: number;
  @Output() closeForm = new EventEmitter<void>();
  bookingEmail = '';
  bookingPhone = '+91';

  passengers: any[] = [];

  touchedFields: any = {};   // tracks touched inputs

  duplicateIdentityMap = new Set<string>();

  nameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
  identityRegex = /^[0-9]{12}$/;
  emailRegex = /^(?!.*\s)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  phoneRegex = /^[0-9]{10}$/;

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.passengers = this.selectedSeats.map(seat => ({
      seatNumber: seat.seatNo,
      fare: Number(seat.price ?? seat.BasePrice ?? 0),
      firstName: '',
      lastName: '',
      age: null,
      gender: seat.restrictedGender || '',
      restrictedGender: seat.restrictedGender || null,
      uniqueIdentityNumber: ''
    }));
  }

  markTouched(field: string) {
    this.touchedFields[field] = true;
  }

  sanitizePhone(): void {

    if (!this.bookingPhone.startsWith('+91')) {
      this.bookingPhone = '+91';
    }

    let digits = this.bookingPhone.substring(3)
      .replace(/[^0-9]/g, '')
      .substring(0, 10);

    this.bookingPhone = '+91' + digits;
  }

  lockPhonePrefix(event: KeyboardEvent) {

    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart ?? 0;

    if (cursorPos <= 3 && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
    }
  }

  allowOnlyPhoneDigits(event: KeyboardEvent) {

    if (
      !/^[0-9]$/.test(event.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  allowOnlyNameCharacters(event: KeyboardEvent) {

    if (
      !/^[A-Za-z ]$/.test(event.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  sanitizeName(value: string): string {

    if (!value) return '';

    return value
      .replace(/[^A-Za-z ]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  allowOnlyNumbers(event: KeyboardEvent) {

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  blockNonNumericPaste(event: ClipboardEvent) {

    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  }

  /* -------- Duplicate Aadhaar validation -------- */

  validateUniqueIdentityNumbers(): void {

    this.duplicateIdentityMap.clear();
    const map = new Map<string, number>();

    for (const p of this.passengers) {

      const id = p.uniqueIdentityNumber?.trim();
      if (!id) continue;

      map.set(id, (map.get(id) || 0) + 1);
    }

    map.forEach((count, id) => {
      if (count > 1) this.duplicateIdentityMap.add(id);
    });
  }

  onIdentityChange() {
    this.validateUniqueIdentityNumbers();
  }

  isDuplicateIdentity(p: any) {

    return p.uniqueIdentityNumber &&
      this.duplicateIdentityMap.has(p.uniqueIdentityNumber.trim());
  }

  /* -------- Field validators -------- */

  isInvalidFirstName(p: any) {
    return !p.firstName || !this.nameRegex.test(p.firstName.trim());
  }

  isInvalidLastName(p: any) {
    return !p.lastName || !this.nameRegex.test(p.lastName.trim());
  }

  isInvalidAge(p: any) {
    return !p.age || p.age <= 0 || p.age > 120;
  }

  isInvalidIdentity(p: any) {
    return !p.uniqueIdentityNumber ||
      !this.identityRegex.test(p.uniqueIdentityNumber);
  }

  /* -------- Booking -------- */

 confirmBooking() {

  this.validateUniqueIdentityNumbers();

  const email = this.bookingEmail.trim();
  const phone = this.bookingPhone.trim();
  const digits = phone.substring(3);

  if (!email || !this.emailRegex.test(email)) {
    this.toastr.error("Valid email required");
    return;
  }

  if (!digits || !this.phoneRegex.test(digits)) {
    this.toastr.error("Phone must contain 10 digits");
    return;
  }

  const totalAmount = this.passengers.reduce((sum, p) => sum + p.fare, 0);

  const payload = {
    instanceId: this.instanceId,
    totalAmount: Number(totalAmount),
    passengers: this.passengers.map(p => ({
      seatNumber: p.seatNumber,
      fare: Math.round(Number(p.fare)),
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      age: p.age || 1,
      gender: p.gender || null,
      email: email,
      phoneNumber: phone,
      uniqueIdentityNumber: p.uniqueIdentityNumber.trim()
    }))
  };

  this.api.createOrder(totalAmount).subscribe({
    next: (order: any) => {
      if (!order?.keyId) {
        this.toastr.error('Payments are not configured. Contact support.');
        return;
      }

      const options: any = {
        key: order.keyId,
        amount: order.amount, 
        currency: 'INR',
        name: 'Travel Booking',
        description: 'Ticket Payment',
        order_id: order.orderId,

        handler: (response: any) => {

          this.api.verifyPayment(response).subscribe({

            next: () => {

              const finalPayload = {
                ...payload,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentStatus: 'Success'
              };

              this.api.createBooking(finalPayload).subscribe({

                next: (res: any) => {
                  if (res.status) {
                    this.toastr.success("Booking confirmed successfully");
                    this.router.navigate(['/bookings']);
                  } else {
                    this.toastr.error(res.message);
                  }
                },

                error: (err) => {
                  console.error("BOOKING ERROR:", err);
                  this.toastr.error("Booking failed after payment");
                }

              });

            },

            error: (err) => {
              console.error("VERIFY ERROR:", err);
              this.toastr.error("Payment verification failed");
            }

          });
        },

        modal: {
          ondismiss: () => {
            this.toastr.warning("Payment cancelled");
          }
        },

        prefill: {
          email: email,
          contact: phone
        },

        theme: {
          color: '#f06e03'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },

    error: () => {
      this.toastr.error("Failed to initiate payment");
    }
  });
}
  clearForm() {

    this.bookingEmail = '';
    this.bookingPhone = '+91';

    this.passengers.forEach(p => {
      p.firstName = '';
      p.lastName = '';
      p.age = null;
      p.gender = p.restrictedGender || '';
      p.uniqueIdentityNumber = '';
    });

    this.duplicateIdentityMap.clear();
  }

  close() {
    this.closeForm.emit();
  }
}
