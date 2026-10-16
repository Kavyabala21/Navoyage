import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { of } from 'rxjs';

describe('Login Component', () => {

  let component: Login;
  let fixture: ComponentFixture<Login>;

  let routerSpy: jasmine.SpyObj<Router>;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let facadeSpy: jasmine.SpyObj<DataFacade>;

  beforeEach(async () => {

  routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  httpSpy = jasmine.createSpyObj('HttpClient', ['get']);
  toastrSpy = jasmine.createSpyObj('ToastrService', ['warning']);
  facadeSpy = jasmine.createSpyObj('DataFacade', ['loginUser']);

  httpSpy.get.and.returnValue(of([]));

  await TestBed.configureTestingModule({
    imports: [Login],
    providers: [
      FormBuilder,
      { provide: Router, useValue: routerSpy },
      { provide: HttpClient, useValue: httpSpy },
      { provide: ToastrService, useValue: toastrSpy },
      { provide: DataFacade, useValue: facadeSpy }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(Login);
  component = fixture.componentInstance;

  // FIX: prevent timer issues from other components (like Stop map.invalidateSize)
  spyOn(window as any, 'setTimeout').and.callFake((fn: Function) => {
    fn();
    return 0;
  });

  fixture.detectChanges();
});

  /* ---------------- CREATE ---------------- */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ---------------- INIT ---------------- */

  it('should initialize form and load countries', () => {

    component.ngOnInit();

    expect(httpSpy.get).toHaveBeenCalled();
    expect(component.form).toBeTruthy();
  });

  /* ---------------- LOAD COUNTRIES ---------------- */

  it('should populate countries', () => {

    const mockCountries = [{ name: 'India', code: '+91' }];
    httpSpy.get.and.returnValue(of(mockCountries));

    component.loadCountries();

    expect(component.countries.length).toBe(1);
  });

  /* ---------------- MODE CHANGE ---------------- */

  it('should update validators when mode changes to username', () => {

    component.form.patchValue({ loginMode: 'username' });

    component.onModeChange();

    expect(component.mode).toBe('username');
  });

  it('should update validators when mode changes to email', () => {

    component.form.patchValue({ loginMode: 'email' });

    component.onModeChange();

    expect(component.mode).toBe('email');
  });

  it('should update validators when mode changes to phone', () => {

    component.form.patchValue({ loginMode: 'phone' });

    component.onModeChange();

    expect(component.mode).toBe('phone');
  });

  /* ---------------- PHONE SANITIZE ---------------- */

  it('should sanitize phone number', () => {

    component.form.get('localPhone')?.setValue('+91-123abc456789');

    component.sanitizePhone();

    expect(component.form.get('localPhone')?.value.startsWith('+91-')).toBeTrue();
  });

  it('should return if phone control missing', () => {

    spyOn(component.form, 'get').and.returnValue(null);

    component.sanitizePhone();

    expect().nothing();
  });

  /* ---------------- MERGE PHONE ---------------- */

  it('should merge phone number', () => {

    component.form.patchValue({ localPhone: '+91-9876543210' });

    component.mergePhone();

    expect(component.form.value.phoneNumber).toBe('+91-9876543210');
  });

  /* ---------------- INPUT GUARDS ---------------- */

  it('should allow only numbers', () => {

    const event: any = { key: 'a', preventDefault: jasmine.createSpy() };

    component.allowOnlyNumbers(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should block non numeric characters', () => {

    const event: any = { key: 'a', preventDefault: jasmine.createSpy() };

    component.blockNonNumeric(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  /* ---------------- PASSWORD TOGGLE ---------------- */

  it('should toggle password visibility', () => {

    const initial = component.showPassword;

    component.togglePassword();

    expect(component.showPassword).toBe(!initial);
  });

  /* ---------------- FIELD ERROR ---------------- */

  it('should return empty error when field untouched', () => {

    const result = component.fieldError('email');

    expect(result).toBe('');
  });

  /* ---------------- LOGIN ---------------- */

  it('should mark form touched if invalid', () => {

    component.form.patchValue({ password: '' });

    component.onLogin();

    expect(component.form.touched).toBeTrue();
  });

it('should call facade loginUser with username', () => {

  component.form.patchValue({ loginMode: 'username' });
  component.onModeChange();

  component.form.patchValue({
    username: 'testuser',
    password: 'password123'
  });

  component.onLogin();

  expect(facadeSpy.loginUser).toHaveBeenCalled();
});


  it('should call facade loginUser with email', () => {

    component.mode = 'email';

    component.form.patchValue({
      email: 'test@test.com',
      password: 'password123'
    });

    component.form.get('password')?.setErrors(null);

    component.onLogin();

    expect(facadeSpy.loginUser).toHaveBeenCalled();
  });

it('should call facade loginUser with phone', () => {

  component.form.patchValue({ loginMode: 'phone' });
  component.onModeChange();

  component.form.patchValue({
    localPhone: '+91-9876543210',
    phoneNumber: '+91-9876543210',
    password: 'password123'
  });

  component.onLogin();

  expect(facadeSpy.loginUser).toHaveBeenCalled();
});

  /* ---------------- MODE NOT SET ---------------- */

  it('should show warning if mode not selected', () => {

    component.mode = '';

    component.modenotset();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  /* ---------------- SIGNUP ---------------- */

  it('should navigate to register page', () => {

    component.signup();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/register']);
  });
it('should prevent editing phone prefix', () => {

  const event: any = {
    target: { selectionStart: 2 },
    preventDefault: jasmine.createSpy()
  };

  component.lockPhonePrefix(event);

  expect(event.preventDefault).toHaveBeenCalled();
});it('should allow typing after prefix', () => {

  const event: any = {
    target: { selectionStart: 5 },
    preventDefault: jasmine.createSpy()
  };

  component.lockPhonePrefix(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should allow numeric key', () => {

  const event: any = { key: '5', preventDefault: jasmine.createSpy() };

  component.allowOnlyNumbers(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should allow control keys', () => {

  const event: any = { key: 'Backspace', preventDefault: jasmine.createSpy() };

  component.allowOnlyNumbers(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should allow numeric key in blockNonNumeric', () => {

  const event: any = { key: '3', preventDefault: jasmine.createSpy() };

  component.blockNonNumeric(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should allow arrow keys in blockNonNumeric', () => {

  const event: any = { key: 'ArrowLeft', preventDefault: jasmine.createSpy() };

  component.blockNonNumeric(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should return username required error', () => {

  const control = component.form.get('username');
  control?.setErrors({ required: true });
  control?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Username is required');
});it('should return email validation error', () => {

  const control = component.form.get('email');
  control?.setErrors({ pattern: true });
  control?.markAsTouched();

  const result = component.fieldError('email');

  expect(result).toBe('Enter a valid email address');
});it('should return phone validation error', () => {

  const control = component.form.get('localPhone');
  control?.setErrors({ pattern: true });
  control?.markAsTouched();

  const result = component.fieldError('localPhone');

  expect(result).toContain('Enter a valid Indian mobile number');
});it('should assign countries from http response', () => {

  const mock = [
    { name: 'India', code: '+91' },
    { name: 'USA', code: '+1' }
  ];

  httpSpy.get.and.returnValue(of(mock));

  component.loadCountries();

  expect(component.countries.length).toBe(2);
});it('should add +91- prefix if missing in sanitizePhone', () => {

  component.form.get('localPhone')?.setValue('9876543210');

  component.sanitizePhone();

  const value = component.form.get('localPhone')?.value;

  expect(value.startsWith('+91-')).toBeTrue();
});it('should keep existing +91- prefix in sanitizePhone', () => {

  component.form.get('localPhone')?.setValue('+91-9876543210');

  component.sanitizePhone();

  expect(component.form.get('localPhone')?.value).toBe('+91-9876543210');
});it('should allow navigation keys in blockNonNumeric', () => {

  const event: any = {
    key: 'Backspace',
    preventDefault: jasmine.createSpy()
  };

  component.blockNonNumeric(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should allow arrow keys in blockNonNumeric', () => {

  const event: any = {
    key: 'ArrowLeft',
    preventDefault: jasmine.createSpy()
  };

  component.blockNonNumeric(event);

  expect(event.preventDefault).not.toHaveBeenCalled();
});it('should return empty string when control not touched', () => {

  const result = component.fieldError('email');

  expect(result).toBe('');
});it('should return username required error', () => {

  const c = component.form.get('username');
  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Username is required');
});it('should return email required error', () => {

  const c = component.form.get('email');
  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('email');

  expect(result).toBe('Email is required');
});it('should return phone required error', () => {

  const c = component.form.get('localPhone');
  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('localPhone');

  expect(result).toBe('Phone number is required');
});it('should return password required error', () => {

  const c = component.form.get('password');
  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('password');

  expect(result).toBe('Password is required');
});it('should return minlength error', () => {

  const c = component.form.get('username');
  c?.setErrors({ minlength: true });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Minimum length not met');
});it('should return maxlength error', () => {

  const c = component.form.get('username');
  c?.setErrors({ maxlength: true });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Maximum length exceeded');
});it('should return username pattern error', () => {

  const c = component.form.get('username');
  c?.setErrors({ pattern: true });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Username cannot contain spaces or special characters');
});it('should return email pattern error', () => {

  const c = component.form.get('email');
  c?.setErrors({ pattern: true });
  c?.markAsTouched();

  const result = component.fieldError('email');

  expect(result).toBe('Enter a valid email address');
});it('should return phone pattern error', () => {

  const c = component.form.get('localPhone');
  c?.setErrors({ pattern: true });
  c?.markAsTouched();

  const result = component.fieldError('localPhone');

  expect(result).toContain('Enter a valid Indian mobile number');
});it('should return password pattern error', () => {

  const c = component.form.get('password');
  c?.setErrors({ pattern: true });
  c?.markAsTouched();

  const result = component.fieldError('password');

  expect(result).toBe('Password cannot contain spaces');
});
it('should return country code required error', () => {

  const c = component.form.get('countryCode');

  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('countryCode');

  expect(result).toBe('Country code is required');
});it('should return password required error', () => {

  const c = component.form.get('password');

  c?.setErrors({ required: true });
  c?.markAsTouched();

  const result = component.fieldError('password');

  expect(result).toBe('Password is required');
});it('should return minlength error', () => {

  const c = component.form.get('username');

  c?.setErrors({ minlength: { requiredLength: 3, actualLength: 1 } });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Minimum length not met');
});it('should return maxlength error', () => {

  const c = component.form.get('username');

  c?.setErrors({ maxlength: { requiredLength: 50, actualLength: 60 } });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('Maximum length exceeded');
});it('should return password pattern error', () => {

  const c = component.form.get('password');

  c?.setErrors({ pattern: true });
  c?.markAsTouched();

  const result = component.fieldError('password');

  expect(result).toBe('Password cannot contain spaces');
});it('should return empty string when no matching error', () => {

  const c = component.form.get('username');

  c?.setErrors({ custom: true });
  c?.markAsTouched();

  const result = component.fieldError('username');

  expect(result).toBe('');
});
it('should return password required inside pattern block', () => {

  const c = component.form.get('password');

  // simulate pattern block execution
  c?.setErrors({ pattern: true, required: true });
  c?.markAsTouched();

  const result = component.fieldError('password');

  expect(result).toBe('Password is required');
});it('should cover required inside password pattern branch', () => {

  const c = component.form.get('password');

  c?.markAsTouched();

  (c as any).errors = { pattern: true, required: true };

  const result = component.fieldError('password');

  expect(result).toBe('Password is required');
});
});