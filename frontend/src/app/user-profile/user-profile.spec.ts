import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfile } from './user-profile';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthSignal } from '../core/auth/auth-signal';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('UserProfile Component', () => {

  let component: UserProfile;
  let fixture: ComponentFixture<UserProfile>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthSignal>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'login',
      'updateUser'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authSpy = jasmine.createSpyObj<AuthSignal>('AuthSignal', [
      'user',
      'updateUser'
    ]);

    authSpy.user.and.returnValue({
      id: 1,
      name: 'TestUser',
      email: 'test@test.com',
      phoneNumber: '+91-9999999999',
      role: 'Customer',
      isLoggedIn: true,
      InLoginPage: false
    });

    await TestBed.configureTestingModule({
      imports: [UserProfile, ReactiveFormsModule],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthSignal, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfile);
    component = fixture.componentInstance;

    apiSpy.login.and.returnValue(of({ status: true }));
    apiSpy.updateUser.and.returnValue(of({ status: true }));

    fixture.detectChanges();
  });

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data', () => {
    component.ngOnInit();

    expect(component.username).toBe('TestUser');
    expect(component.role).toBe('Customer');
  });

  /* ---------------- PROFILE UPDATE ---------------- */

  it('should update profile successfully', () => {

    component.profileForm.setValue({
      email: 'new@test.com',
      phoneNumber: '9999999999',
      currentPassword: 'Password@123'
    });

    component.updateProfile();

    expect(apiSpy.login).toHaveBeenCalled();
  });

  it('should handle incorrect password', () => {

    apiSpy.login.and.returnValue(
      throwError(() => new Error())
    );

    component.profileForm.setValue({
      email: 'test@test.com',
      phoneNumber: '9999999999',
      currentPassword: 'Password@123'
    });

    component.updateProfile();

    expect(toastrSpy.error).toHaveBeenCalledWith('Incorrect password');
  });

  /* ---------------- PASSWORD UPDATE ---------------- */

  it('should update password successfully', () => {

    component.passwordForm.setValue({
      oldPassword: 'Password@123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });

    component.updatePassword();

    expect(apiSpy.login).toHaveBeenCalled();
  });

  it('should show error if old password incorrect', () => {

    apiSpy.login.and.returnValue(
      throwError(() => new Error())
    );

    component.passwordForm.setValue({
      oldPassword: 'Password@123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });

    component.updatePassword();

    expect(toastrSpy.error).toHaveBeenCalledWith('Old password is incorrect');
  });

  it('should return null from passwordMatch when controls are missing', () => {
    const result = component.passwordMatch({
      get: () => null
    } as any);

    expect(result).toBeNull();
  });

  /* ---------------- PASSWORD VALIDATION ---------------- */

  it('should detect password mismatch', () => {

    component.passwordForm.setValue({
      oldPassword: 'Password@123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'Mismatch123'
    });

    const errors = component.passwordForm.get('confirmPassword')?.errors;

    expect(errors?.['mismatch']).toBeTrue();
  });

  /* ---------------- HELPERS ---------------- */

  it('should sanitize phone number', () => {

    component.profileForm.patchValue({
      phoneNumber: '99999abc999'
    });

    component.sanitizePhone();

    expect(component.profileForm.value.phoneNumber).toBe('99999999');
  });

  it('should return space validation error object', () => {
    expect(component.noSpaces({ value: 'has space' } as any)).toEqual({ space: true });
  });

  it('should allow only numbers', () => {

    const event = new KeyboardEvent('keydown', { key: 'a' });
    spyOn(event, 'preventDefault');

    component.allowOnlyNumbers(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should navigate to dashboard', () => {

    component.gotohome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
  /* ---------------- MODE METHODS ---------------- */

  it('should enable edit mode', () => {

    component.enableEdit();

    expect(component.editMode).toBeTrue();
    expect(component.changePasswordMode).toBeFalse();

  });

  it('should enable change password mode', () => {

    spyOn(component.passwordForm, 'reset');

    component.changepassword();

    expect(component.changePasswordMode).toBeTrue();
    expect(component.editMode).toBeFalse();
    expect(component.passwordForm.reset).toHaveBeenCalled();

  });

  it('should cancel editing and reload user', () => {

    spyOn(component, 'loadUser');

    component.editMode = true;
    component.changePasswordMode = true;

    component.cancel();

    expect(component.editMode).toBeFalse();
    expect(component.changePasswordMode).toBeFalse();
    expect(component.loadUser).toHaveBeenCalled();

  });
  it('should mark form touched and return if profile form is invalid', () => {

    component.profileForm.patchValue({
      email: '',              // invalid
      phoneNumber: '',        // invalid
      currentPassword: ''     // invalid
    });

    spyOn(component.profileForm, 'markAllAsTouched');

    component.updateProfile();

    expect(component.profileForm.markAllAsTouched).toHaveBeenCalled();
    expect(apiSpy.login).not.toHaveBeenCalled();

  }); it('should show error when profile update fails', () => {

    // login succeeds
    apiSpy.login.and.returnValue(of({ status: true }));

    // updateUser fails
    apiSpy.updateUser.and.returnValue(
      throwError(() => new Error('Update failed'))
    );

    component.profileForm.setValue({
      email: 'test@test.com',
      phoneNumber: '9999999999',
      currentPassword: 'Password@123'
    });

    component.updateProfile();

    expect(component.verifying).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalledWith('Profile update failed');

  }); it('should mark password form touched and return if invalid', () => {

    component.passwordForm.patchValue({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    spyOn(component.passwordForm, 'markAllAsTouched');

    component.updatePassword();

    expect(component.passwordForm.markAllAsTouched).toHaveBeenCalled();
    expect(apiSpy.login).not.toHaveBeenCalled();

  }); it('should show error when password update fails', () => {

    // login succeeds
    apiSpy.login.and.returnValue(of({ status: true }));

    // updateUser fails
    apiSpy.updateUser.and.returnValue(
      throwError(() => new Error('Update failed'))
    );

    component.passwordForm.setValue({
      oldPassword: 'Password@123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });

    component.updatePassword();

    expect(component.verifying).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalledWith('Password update failed');

  }); it('should return email pattern error', () => {

    const control = component.profileForm.get('email');
    control?.setErrors({ pattern: true });
    control?.markAsTouched();

    const result = component.fieldError(component.profileForm, 'email');

    expect(result).toBe('Enter a valid email address (example: user@example.com)');
  }); it('should return phone number pattern error', () => {

    const control = component.profileForm.get('phoneNumber');
    control?.setErrors({ pattern: true });
    control?.markAsTouched();

    const result = component.fieldError(component.profileForm, 'phoneNumber');

    expect(result).toBe('Enter a valid Indian mobile number (+91-XXXXXXXXXX)');
  }); it('should return required error', () => {

    const control = component.profileForm.get('email');
    control?.setErrors({ required: true });
    control?.markAsTouched();

    const result = component.fieldError(component.profileForm, 'email');

    expect(result).toBe('This field is required');
  }); it('should return minlength error', () => {

    const control = component.profileForm.get('currentPassword');
    control?.setErrors({ minlength: true });
    control?.markAsTouched();

    const result = component.fieldError(component.profileForm, 'currentPassword');

    expect(result).toBe('Minimum 8 characters required');
  }); it('should return uppercase error', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ uppercase: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Password must contain at least one uppercase letter');
  }); it('should return confirm password mismatch error', () => {

    const control = component.passwordForm.get('confirmPassword');
    control?.setErrors({ mismatch: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'confirmPassword');

    expect(result).toBe('Passwords do not match');
  }); it('should return empty string when no errors', () => {

    const result = component.fieldError(component.profileForm, 'email');

    expect(result).toBe('');
  });/* ---------------- PASSWORD VISIBILITY TOGGLES ---------------- */

  it('should toggle old password visibility', () => {

    component.showOldPassword = false;

    component.toggleOldPassword();

    expect(component.showOldPassword).toBeTrue();

    component.toggleOldPassword();

    expect(component.showOldPassword).toBeFalse();

  });

  it('should toggle new password visibility', () => {

    component.showNewPassword = false;

    component.toggleNewPassword();

    expect(component.showNewPassword).toBeTrue();

    component.toggleNewPassword();

    expect(component.showNewPassword).toBeFalse();

  });

  it('should toggle confirm password visibility', () => {

    component.showConfirmPassword = false;

    component.toggleConfirmPassword();

    expect(component.showConfirmPassword).toBeTrue();

    component.toggleConfirmPassword();

    expect(component.showConfirmPassword).toBeFalse();

  }); it('should return early in sanitizePhone if control is null', () => {

    component.ngOnInit();

    const control = component.profileForm.get('phoneNumber');

    spyOn(component.profileForm, 'get').and.returnValue(null as any);

    component.sanitizePhone();

    expect(component.profileForm.get).toHaveBeenCalledWith('phoneNumber');

  }); it('should return maxlength error message', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ maxlength: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Maximum 50 characters allowed');

  }); it('should return lowercase validation error', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ lowercase: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Password must contain at least one lowercase letter');

  }); it('should return number validation error', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ number: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Password must contain at least one number');

  }); it('should return special character validation error', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ special: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Password must contain at least one special character');

  }); it('should return space validation error', () => {

    const control = component.passwordForm.get('newPassword');
    control?.setErrors({ space: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'newPassword');

    expect(result).toBe('Password cannot contain spaces');

  }); it('should return confirm password required error', () => {

    const control = component.passwordForm.get('confirmPassword');
    control?.setErrors({ required: true });
    control?.markAsTouched();

    const result = component.fieldError(component.passwordForm, 'confirmPassword');

    expect(result).toBe('This field is required');
  }); it('should return empty string when no errors exist', () => {

    const result = component.fieldError(component.profileForm, 'email');

    expect(result).toBe('');

  });
});
