import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassengerForm } from './passenger-form';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('PassengerForm Component', () => {

  let component: PassengerForm;
  let fixture: ComponentFixture<PassengerForm>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    /* FIX: prevent Stop component map timer from executing */
    spyOn(window as any, 'setTimeout').and.callFake(
      (handler: TimerHandler) => 0
    );

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'createOrder',
      'verifyPayment',
      'createBooking'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PassengerForm],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PassengerForm);
    component = fixture.componentInstance;

    component.selectedSeats = [
      { seatNo: 1, price: 100 },
      { seatNo: 2, price: 150 }
    ];

    component.instanceId = 10;

    apiSpy.createOrder.and.returnValue(
      of({ keyId: 'checkout-public-id', amount: 250, orderId: 'order_123' })
    );
    apiSpy.verifyPayment.and.returnValue(
      of({ status: true })
    );
    apiSpy.createBooking.and.returnValue(
      of({ status: true, data: null })
    );

    (window as any).Razorpay = function (options: any) {
      return {
        open: () => options.handler({
          razorpay_order_id: options.order_id,
          razorpay_payment_id: 'payment_123',
          razorpay_signature: 'signature_123'
        })
      };
    };

    component.ngOnInit();
    fixture.detectChanges();
  });

  /* ================= INIT ================= */

  it('should initialize passengers from seats', () => {

    expect(component.passengers.length).toBe(2);
    expect(component.passengers[0].seatNumber).toBe(1);
  });

  /* ================= TOUCH ================= */

  it('should mark field as touched', () => {

    component.markTouched('firstName');

    expect(component.touchedFields['firstName']).toBeTrue();
  });

  /* ================= PHONE ================= */

  it('should sanitize phone correctly', () => {

    component.bookingPhone = '+91abc123456789';
    component.sanitizePhone();

    expect(component.bookingPhone).toBe('+91123456789');
  });

  /* ================= NAME ================= */

  it('should sanitize name', () => {

    const result = component.sanitizeName('John@@ Doe!!');

    expect(result).toBe('John Doe');
  });

  it('should return empty for invalid name input', () => {

    const result = component.sanitizeName('');

    expect(result).toBe('');
  });

  /* ================= DUPLICATE ID ================= */

  it('should detect duplicate identity numbers', () => {

    component.passengers = [
      { uniqueIdentityNumber: '123456789012' },
      { uniqueIdentityNumber: '123456789012' }
    ];

    component.validateUniqueIdentityNumbers();

    expect(component.duplicateIdentityMap.has('123456789012')).toBeTrue();
  });

  it('should not mark unique IDs as duplicate', () => {

    component.passengers = [
      { uniqueIdentityNumber: '123456789012' },
      { uniqueIdentityNumber: '999999999999' }
    ];

    component.validateUniqueIdentityNumbers();

    expect(component.duplicateIdentityMap.size).toBe(0);
  });

  it('should detect duplicate identity helper', () => {

    component.passengers = [
      { uniqueIdentityNumber: '123456789012' },
      { uniqueIdentityNumber: '123456789012' }
    ];

    component.validateUniqueIdentityNumbers();

    const result = component.isDuplicateIdentity({
      uniqueIdentityNumber: '123456789012'
    });

    expect(result).toBeTrue();
  });

  /* ================= VALIDATORS ================= */

  it('should validate first name', () => {

    const p = { firstName: '' };

    expect(component.isInvalidFirstName(p)).toBeTrue();
  });

  it('should validate last name', () => {

    const p = { lastName: '' };

    expect(component.isInvalidLastName(p)).toBeTrue();
  });

  it('should validate age', () => {

    const p = { age: 0 };

    expect(component.isInvalidAge(p)).toBeTrue();
  });

  it('should validate identity', () => {

    const p = { uniqueIdentityNumber: '123' };

    expect(component.isInvalidIdentity(p)).toBeTrue();
  });

  /* ================= BOOKING ================= */

  it('should return if email invalid', () => {

    component.bookingEmail = 'invalid';
    component.bookingPhone = '+919999999999';

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should return if phone invalid', () => {

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+91123';

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should use the public checkout key returned by the backend', () => {
    component.bookingEmail = 'test@example.com';
    component.bookingPhone = '+919999999999';
    const checkout = jasmine.createSpy('Razorpay').and.returnValue({ open: jasmine.createSpy('open') });
    (window as any).Razorpay = checkout;

    component.confirmBooking();

    expect(checkout).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'checkout-public-id' }));
  });

  it('should not open checkout when the backend does not supply a public key', () => {
    component.bookingEmail = 'test@example.com';
    component.bookingPhone = '+919999999999';
    apiSpy.createOrder.and.returnValue(of({ amount: 250, orderId: 'order_123' }));
    const checkout = jasmine.createSpy('Razorpay');
    (window as any).Razorpay = checkout;

    component.confirmBooking();

    expect(checkout).not.toHaveBeenCalled();
    expect(toastrSpy.error).toHaveBeenCalledWith('Payments are not configured. Contact support.');
  });

  it('should create booking successfully', () => {

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(apiSpy.createBooking).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/bookings']);
  });

  it('should show API error message', () => {

    apiSpy.createBooking.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalledWith('Booking failed after payment');
  });

  /* ================= CLEAR ================= */

  it('should clear form', () => {

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012',
        restrictedGender: null
      }
    ];

    component.clearForm();

    expect(component.bookingEmail).toBe('');
    expect(component.bookingPhone).toBe('+91');
  });

  /* ================= NAVIGATION ================= */

  it('should call close method', () => {

    component.close();

    expect(component).toBeTruthy();
  });
  it('should reset phone to +91 if prefix is missing', () => {

    component.bookingPhone = '9876543210'; // no +91 prefix

    component.sanitizePhone();

    expect(component.bookingPhone).toBe('+91');
  }); it('should enforce +91 prefix when modified', () => {

    component.bookingPhone = '+1abc9999999999';

    component.sanitizePhone();

    expect(component.bookingPhone.startsWith('+91')).toBeTrue();
  }); it('should prevent deleting +91 prefix', () => {

    const input = document.createElement('input');
    input.selectionStart = 2;

    const event = {
      target: input,
      key: 'Backspace',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.lockPhonePrefix(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });
  it('should allow deleting after prefix', () => {

    const input = document.createElement('input');

    Object.defineProperty(input, 'selectionStart', {
      value: 5,
      writable: true
    });

    const event = {
      target: input,
      key: 'Backspace',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.lockPhonePrefix(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });
  it('should prevent Delete key before prefix', () => {

    const input = document.createElement('input');
    input.selectionStart = 1;

    const event = {
      target: input,
      key: 'Delete',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.lockPhonePrefix(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should allow numeric phone digits', () => {

    const event = {
      key: '5',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyPhoneDigits(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should allow control keys for phone input', () => {

    const event = {
      key: 'Backspace',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyPhoneDigits(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should block non numeric phone characters', () => {

    const event = {
      key: 'A',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyPhoneDigits(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should allow alphabet characters in name input', () => {

    const event = {
      key: 'A',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNameCharacters(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should allow space in name input', () => {

    const event = {
      key: ' ',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNameCharacters(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should allow navigation and control keys', () => {

    const event = {
      key: 'Backspace',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNameCharacters(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should block non alphabet characters', () => {

    const event = {
      key: '5',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNameCharacters(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should allow numeric characters', () => {

    const event = {
      key: '5',
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNumbers(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should block non numeric characters', () => {

    const event = {
      key: 'A',

      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.allowOnlyNumbers(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should allow numeric paste', () => {

    const event = {
      clipboardData: {
        getData: () => '123456'
      },
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as ClipboardEvent;

    component.blockNonNumericPaste(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  }); it('should block non numeric paste', () => {

    const event = {
      clipboardData: {
        getData: () => 'abc123'
      },
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as ClipboardEvent;

    component.blockNonNumericPaste(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should block paste when clipboard data is empty', () => {

    const event = {
      clipboardData: {
        getData: () => ''
      },
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as ClipboardEvent;

    component.blockNonNumericPaste(event);

    expect(event.preventDefault).toHaveBeenCalled();
  }); it('should call validateUniqueIdentityNumbers on identity change', () => {

    const spy = spyOn(component, 'validateUniqueIdentityNumbers');

    component.onIdentityChange();

    expect(spy).toHaveBeenCalled();
  });
  it('should show error toast when booking response status is false', () => {

    apiSpy.createBooking.and.returnValue(
      of({ status: false, message: 'Booking failed' })
    );

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalledWith('Booking failed');
  });
  it('should handle API error when error.error is a string', () => {

    apiSpy.createBooking.and.returnValue(
      throwError(() => ({ error: 'Plain server error' }))
    );

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalledWith('Booking failed after payment');
  }); it('should handle API error when error contains title', () => {

    apiSpy.createBooking.and.returnValue(
      throwError(() => ({ error: { title: 'Validation failed' } }))
    );

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(toastrSpy.error).toHaveBeenCalledWith('Booking failed after payment');
  });
  it('should handle API validation errors', () => {

    apiSpy.createBooking.and.returnValue(
      throwError(() => ({
        error: {
          errors: {
            firstName: ['First name required'],
            age: ['Age must be greater than 0']
          }
        }
      }))
    );

    component.bookingEmail = 'test@test.com';
    component.bookingPhone = '+919999999999';

    component.passengers = [
      {
        seatNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
        uniqueIdentityNumber: '123456789012'
      }
    ];

    component.confirmBooking();

    expect(toastrSpy.error)
      .toHaveBeenCalledWith('Booking failed after payment');
  });
});
