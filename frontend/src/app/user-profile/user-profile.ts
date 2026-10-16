import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { AuthSignal } from '../core/auth/auth-signal';
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.html'
})
export class UserProfile implements OnInit {

  userId!: number;
  username: string | null = null;
  role: string | null = null;

  editMode = false;
  changePasswordMode = false;
  verifying = false;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  originalEmail: string | null = null;
  originalPhone: string | null = null;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private api: Api_Calls,
    private authSignal: AuthSignal
  ) { }

  ngOnInit(): void {
    const user = this.authSignal.user();
    this.userId = Number(user?.id);
    this.username = user?.name ?? null;
    this.role = user?.role ?? null;
    this.originalEmail = user?.email ?? null;
    this.originalPhone = user?.phoneNumber ?? null;

    this.buildForms();
    this.loadUser();
  }

  /* ================= FORMS ================= */

  buildForms() {

    this.profileForm = this.fb.group({
      email: [
        this.originalEmail ?? '',
        [
          Validators.required,
          Validators.pattern(/^(?!.*\s)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
        ]
      ],

      phoneNumber: [
        (this.originalPhone ?? '').replace('+91-', ''),
        [
          Validators.required,
          Validators.pattern(/^[6-9][0-9]{9}$/)
        ]
      ],

      currentPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ]
    });


    this.passwordForm = this.fb.group({
      oldPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],

      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
          this.hasUppercase,
          this.hasLowercase,
          this.hasNumber,
          this.hasSpecialCharacter,
          this.noSpaces
        ]
      ],

      confirmPassword: ['', Validators.required]

    }, { validators: this.passwordMatch });

  } hasUppercase(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return /[A-Z]/.test(value) ? null : { uppercase: true };
  }
  sanitizePhone(): void {

    const control = this.profileForm.get('phoneNumber');
    if (!control) return;

    let digits = control.value || '';

    digits = digits.replace(/[^0-9]/g, '');
    digits = digits.substring(0, 10);

    control.setValue(digits, { emitEvent: false });

  }
  passwordMatch(group: AbstractControl): ValidationErrors | null {

    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;

    if (confirmPassword.errors && !confirmPassword.errors['mismatch']) {
      return null;
    }

    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }

    return null;
  }
  hasLowercase(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return /[a-z]/.test(value) ? null : { lowercase: true };
  }

  hasNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return /\d/.test(value) ? null : { number: true };
  }

  hasSpecialCharacter(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return /[@$!%*?&._#^+=-]/.test(value) ? null : { special: true };
  }

  noSpaces(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return /\s/.test(value) ? { space: true } : null;
  }
  loadUser() {
    this.profileForm.patchValue({
      email: this.originalEmail ?? '',
      phoneNumber: (this.originalPhone ?? '').replace('+91-', ''),
      currentPassword: ''
    });
  }
  allowOnlyNumbers(event: KeyboardEvent) {

    const key = event.key;

    if (
      !/^[0-9]$/.test(key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)
    ) {
      event.preventDefault();
    }

  }
  /* ================= MODE ================= */

  enableEdit() {
    this.editMode = true;
    this.changePasswordMode = false;
  }

  changepassword() {
    this.changePasswordMode = true;
    this.editMode = false;
    this.passwordForm.reset();
  }

  cancel() {
    this.editMode = false;
    this.changePasswordMode = false;
    this.loadUser();
  }

  /* ================= UPDATE PROFILE ================= */

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.verifying = true;

    this.api.login({
      userName: this.username ?? '',
      password: this.profileForm.value.currentPassword
    }).subscribe({
      next: () => {

        const payload = {
          userId: this.userId,
          fullName: this.username,

          email: this.profileForm.value.email || this.originalEmail,
          phoneNumber: this.profileForm.value.phoneNumber
            ? `+91-${this.profileForm.value.phoneNumber}`
            : this.originalPhone,
          password: this.profileForm.value.currentPassword,
          modifiedBy: this.userId,
          isActive: true
        };
        this.api.updateUser(payload).subscribe({
          next: () => {
            this.originalEmail = payload.email ?? '';
            this.originalPhone = payload.phoneNumber ?? '';

            this.authSignal.updateUser({
              email: payload.email ?? '',
              phoneNumber: payload.phoneNumber ?? ''
            });

            this.verifying = false;
            this.editMode = false;
            this.toastr.success('Profile updated successfully');
          },
          error: () => {
            this.verifying = false;
            this.toastr.error('Profile update failed');
          }
        });
      },
      error: () => {
        this.verifying = false;
        this.toastr.error('Incorrect password');
      }
    });
  }

  /* ================= UPDATE PASSWORD ================= */

  updatePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.verifying = true;

    this.api.login({
      userName: this.username,
      password: this.passwordForm.value.oldPassword
    }).subscribe({
      next: () => {
        const payload = {
          userId: this.userId,
          fullName: this.username,
          email: this.originalEmail,
          phoneNumber: this.originalPhone,
          password: this.passwordForm.value.newPassword,
          modifiedBy: this.userId,
          isActive: true
        };

        this.api.updateUser(payload).subscribe({
          next: () => {
            this.verifying = false;
            this.changePasswordMode = false;
            this.toastr.success('Password updated successfully');
          },
          error: () => {
            this.verifying = false;
            this.toastr.error('Password update failed');
          }
        });
      },
      error: () => {
        this.verifying = false;
        this.toastr.error('Old password is incorrect');
      }
    });
  }

  /* ================= HELPERS ================= */

  fieldError(form: FormGroup, field: string): string {

    const c = form.get(field);
    if (!c || !c.touched || !c.errors) return '';

    if (c.errors['required'])
      return 'This field is required';

    if (field === 'email' && c.errors['pattern'])
      return 'Enter a valid email address (example: user@example.com)';

    if (field === 'phoneNumber' && c.errors['pattern'])
      return 'Enter a valid Indian mobile number (+91-XXXXXXXXXX)';

    if (c.errors['minlength'])
      return 'Minimum 8 characters required';

    if (c.errors['maxlength'])
      return 'Maximum 50 characters allowed';

    if (c.errors['required'])
      return 'This field is required';

    if (c.errors['minlength'])
      return 'Password must contain at least 8 characters';

    if (c.errors['maxlength'])
      return 'Password cannot exceed 50 characters';

    if (c.errors['uppercase'])
      return 'Password must contain at least one uppercase letter';

    if (c.errors['lowercase'])
      return 'Password must contain at least one lowercase letter';

    if (c.errors['number'])
      return 'Password must contain at least one number';

    if (c.errors['special'])
      return 'Password must contain at least one special character';

    if (c.errors['space'])
      return 'Password cannot contain spaces';

    if (field === 'confirmPassword') {

      if (c.errors?.['required'])
        return 'Confirm Password is required';

      if (c.errors?.['mismatch'])
        return 'Passwords do not match';

    }

    return '';
  }
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  toggleOldPassword() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  gotohome() {
    sessionStorage.removeItem('transportMode');

    this.router.navigate(['/dashboard']);
  }
}
