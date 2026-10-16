import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('Register Component', () => {

  let component: Register;
  let fixture: ComponentFixture<Register>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let routerSpy: jasmine.SpyObj<Router>;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'register'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    httpSpy = jasmine.createSpyObj('HttpClient', ['get']);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        FormBuilder,
        { provide: Api_Calls, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;

    httpSpy.get.and.returnValue(of([]));

    apiSpy.register.and.returnValue(
      of({ status: true, data: null })
    );

    component.ngOnInit();
    fixture.detectChanges();
  });

  /* ================= INIT ================= */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load countries on init', () => {

    httpSpy.get.and.returnValue(
      of([{ name: 'India', code: '+91' }])
    );

    component.loadCountries();

    expect(component.countries.length).toBe(1);
  });

  /* ================= PHONE ================= */

  it('should sanitize phone number', () => {

    component.form.patchValue({
      localPhone: '+91-abc123456789'
    });

    component.sanitizePhone();

    expect(component.form.value.localPhone).toContain('+91-');
  });

  it('should prevent prefix deletion', () => {

    const event = {
      key: 'Backspace',
      preventDefault: jasmine.createSpy()
    } as any;

    const input = document.createElement('input');
    input.selectionStart = 3;

    event.target = input;

    component.preventPrefixDelete(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  /* ================= PASSWORD VALIDATORS ================= */

  it('should validate uppercase', () => {

    const result = component.hasUppercase({ value: 'abc' } as any);

    expect(result).toEqual({ uppercase: true });
  });

  it('should validate lowercase', () => {

    const result = component.hasLowercase({ value: 'ABC' } as any);

    expect(result).toEqual({ lowercase: true });
  });

  it('should validate number', () => {

    const result = component.hasNumber({ value: 'abc' } as any);

    expect(result).toEqual({ number: true });
  });

  it('should validate special character', () => {

    const result = component.hasSpecialCharacter({ value: 'abc' } as any);

    expect(result).toEqual({ special: true });
  });

  it('should detect spaces in password', () => {

    const result = component.noSpaces({ value: 'abc def' } as any);

    expect(result).toEqual({ space: true });
  });

  it('should detect password mismatch', () => {

    component.form.patchValue({
      password: 'Password1!',
      confirmPassword: 'Password2!'
    });

    const result = component.passwordNotMatch(component.form);

    expect(result).toEqual({ mismatch: true });
  });

  /* ================= ROLE ================= */

  it('should select role', () => {

    component.selectRole('Customer');

    expect(component.selectedRole).toBe('Customer');
    expect(component.form.value.role).toBe('Customer');
  });

  /* ================= PASSWORD TOGGLE ================= */

  it('should toggle password visibility', () => {

    component.togglePassword();

    expect(component.showPassword).toBeTrue();
  });

  it('should toggle confirm password visibility', () => {

    component.toggleConfirmPassword();

    expect(component.showConfirmPassword).toBeTrue();
  });

  /* ================= REGISTER ================= */

  it('should return if form invalid', () => {

    component.form.patchValue({
      role: '',
      fullName: '',
      email: ''
    });

    component.onRegister();

    expect(apiSpy.register).not.toHaveBeenCalled();
  });

  it('should register successfully', () => {

    component.form.patchValue({
      role: 'Customer',
      fullName: 'TestUser',
      email: 'test@test.com',
      localPhone: '+91-9999999999',
      password: 'Password1!',
      confirmPassword: 'Password1!'
    });

    component.onRegister();

    expect(apiSpy.register).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show API failure message', () => {

    apiSpy.register.and.returnValue(
      of({ status: false, message: 'Failed' } as any)
    );

    component.form.patchValue({
      role: 'Customer',
      fullName: 'TestUser',
      email: 'test@test.com',
      localPhone: '+91-9999999999',
      password: 'Password1!',
      confirmPassword: 'Password1!'
    });

    component.onRegister();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should handle API error response', () => {

    apiSpy.register.and.returnValue(
      throwError(() => ({
        error: { errors: { Email: ['Email already exists'] } }
      }))
    );

    component.form.patchValue({
      role: 'Customer',
      fullName: 'TestUser',
      email: 'test@test.com',
      localPhone: '+91-9999999999',
      password: 'Password1!',
      confirmPassword: 'Password1!'
    });

    component.onRegister();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  /* ================= NAVIGATION ================= */

  it('should navigate to login page', () => {

    component.gotoLogin();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
it('should prevent space in blockSpaces', () => {

  const event = {
    key: ' ',
    preventDefault: jasmine.createSpy()
  } as any;

  component.blockSpaces(event);

  expect(event.preventDefault).toHaveBeenCalled();

});

it('should allow non-space characters in blockSpaces', () => {

  const event = {
    key: 'A',
    preventDefault: jasmine.createSpy()
  } as any;

  component.blockSpaces(event);

  expect(event.preventDefault).not.toHaveBeenCalled();

});
it('should allow valid username characters', () => {

  const event = {
    key: 'A',
    preventDefault: jasmine.createSpy()
  } as any;

  component.allowUsernameCharacters(event);

  expect(event.preventDefault).not.toHaveBeenCalled();

});

it('should block invalid username characters', () => {

  const event = {
    key: '@',
    preventDefault: jasmine.createSpy()
  } as any;

  component.allowUsernameCharacters(event);

  expect(event.preventDefault).toHaveBeenCalled();

});
it('should return required error message', () => {

  const control = component.form.get('fullName');
  control?.markAsTouched();
  control?.setErrors({ required: true });

  const result = component.fieldError('fullName');

  expect(result).toBe('This field is required');

});
it('should return username pattern error', () => {

  const control = component.form.get('fullName');
  control?.markAsTouched();
  control?.setErrors({ pattern: true });

  const result = component.fieldError('fullName');

  expect(result).toBe('User name can contain letters, numbers, _, . and -');

});
it('should return email pattern error', () => {

  const control = component.form.get('email');
  control?.markAsTouched();
  control?.setErrors({ pattern: true });

  const result = component.fieldError('email');

  expect(result).toBe('Enter a valid email address');

});it('should return phone pattern error', () => {

  const control = component.form.get('localPhone');
  control?.markAsTouched();
  control?.setErrors({ pattern: true });

  const result = component.fieldError('localPhone');

  expect(result).toBe('Enter a valid 10 digit mobile number');

});it('should return password minlength error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ minlength: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password must contain at least 8 characters');

});it('should return password uppercase error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ uppercase: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password must contain an uppercase letter');

});it('should return password lowercase error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ lowercase: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password must contain a lowercase letter');

});it('should return password number error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ number: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password must contain a number');

});it('should return password special character error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ special: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password must contain a special character');

});it('should return password space error', () => {

  const control = component.form.get('password');
  control?.markAsTouched();
  control?.setErrors({ space: true });

  const result = component.fieldError('password');

  expect(result).toBe('Password cannot contain spaces');

});it('should return confirm password mismatch error', () => {

  const control = component.form.get('confirmPassword');

  control?.setValue('Password2!');
  control?.markAsTouched();
  control?.setErrors(null); // remove required error

  component.form.setErrors({ mismatch: true });

  const result = component.fieldError('confirmPassword');

  expect(result).toBe('Passwords do not match');

});
});