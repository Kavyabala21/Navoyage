import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

interface Country {
  name: string;
  code: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './register.html',
  styleUrl: '../../styles.scss',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class Register implements OnInit {

  form!: FormGroup;
  countries: Country[] = [];

  selectedRole: 'Customer' | 'TravelCompanyOwner' | null = null;

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private service: Api_Calls,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    this.loadCountries();

    this.form = this.fb.group({

      role: ['', Validators.required],

      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z0-9_.\-]{3,50}$/)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/)
        ]
      ],

      localPhone: [
        '+91-',
        [
          Validators.required,
          Validators.pattern(/^\+91-\d{10}$/)
        ]
      ],

      phoneNumber: [''],

      password: [
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

    }, { validators: this.passwordNotMatch });

  }

  loadCountries() {
    this.http.get<Country[]>('Assets/Data/Country-codes.json')
      .subscribe(res => this.countries = res);
  }

  /* ---------- PHONE INPUT CONTROL ---------- */
  sanitizePhone() {

    const control = this.form.get('localPhone');
    if (!control) return;

    let value = control.value || '';

    // Ensure prefix always exists
    if (!value.startsWith('+91-')) {
      value = '+91-';
    }

    let digits = value.slice(4).replace(/\D/g, '');

    digits = digits.substring(0, 10);

    control.setValue('+91-' + digits, { emitEvent: false });

  }
  preventPrefixDelete(event: KeyboardEvent) {

    const input = event.target as HTMLInputElement;

    if (!input) return;

    const cursorPos = input.selectionStart ?? 0;

    // Prevent deleting the prefix
    if ((event.key === 'Backspace' && cursorPos <= 4) ||
      (event.key === 'Delete' && cursorPos < 4)) {
      event.preventDefault();
    }

  }
  /* ---------- PASSWORD VALIDATIONS ---------- */

  hasUppercase(control: AbstractControl): ValidationErrors | null {
    return /[A-Z]/.test(control.value || '') ? null : { uppercase: true };
  }

  hasLowercase(control: AbstractControl): ValidationErrors | null {
    return /[a-z]/.test(control.value || '') ? null : { lowercase: true };
  }

  hasNumber(control: AbstractControl): ValidationErrors | null {
    return /\d/.test(control.value || '') ? null : { number: true };
  }

  hasSpecialCharacter(control: AbstractControl): ValidationErrors | null {
    return /[@$!%*?&._#^+=-]/.test(control.value || '') ? null : { special: true };
  }

  noSpaces(control: AbstractControl): ValidationErrors | null {
    return /\s/.test(control.value || '') ? { space: true } : null;
  }

  passwordNotMatch(group: AbstractControl): ValidationErrors | null {

    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;

    return password === confirmPassword ? null : { mismatch: true };

  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  selectRole(role: 'Customer' | 'TravelCompanyOwner') {
    this.selectedRole = role;
    this.form.patchValue({ role });
  }

  blockSpaces(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault();
  }

  allowUsernameCharacters(event: KeyboardEvent) {

    const key = event.key;

    if (!/^[a-zA-Z0-9_.-]$/.test(key)) {
      event.preventDefault();
    }

  }

  /* ---------- ERROR MESSAGES ---------- */

  fieldError(field: string): string {

    const c = this.form.get(field);

    if (!c || !c.touched) return '';

    if (c.errors?.['required'])
      return 'This field is required';

    if (field === 'fullName' && c.errors?.['pattern'])
      return 'User name can contain letters, numbers, _, . and -';

    if (field === 'email' && c.errors?.['pattern'])
      return 'Enter a valid email address';

    if (field === 'localPhone' && c.errors?.['pattern'])
      return 'Enter a valid 10 digit mobile number';

    if (field === 'password') {

      if (c.errors?.['minlength'])
        return 'Password must contain at least 8 characters';

      if (c.errors?.['uppercase'])
        return 'Password must contain an uppercase letter';

      if (c.errors?.['lowercase'])
        return 'Password must contain a lowercase letter';

      if (c.errors?.['number'])
        return 'Password must contain a number';

      if (c.errors?.['special'])
        return 'Password must contain a special character';

      if (c.errors?.['space'])
        return 'Password cannot contain spaces';

    }

    if (field === 'confirmPassword') {

      if (this.form.errors?.['mismatch'])
        return 'Passwords do not match';

    }

    return '';

  }

  /* ---------- REGISTER ---------- */

  onRegister() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {

      FullName: this.form.value.fullName,
      Email: this.form.value.email,
      PhoneNumber: this.form.value.localPhone,
      Role: this.form.value.role,
      Password: this.form.value.password

    };

    this.service.register(payload).subscribe({

      next: (res: any) => {

        if (res?.status === true || res?.success === true) {

          this.toastr.success('Registration successful');
          this.router.navigate(['/login']);

        } else {

          this.toastr.error(res?.message || 'Registration failed');

        }

      },

      error: (err) => {
        const errors = err?.error?.errors;

        if (errors) {
          const firstError = Object.values(errors)[0];
          this.toastr.error(Array.isArray(firstError) ? firstError[0] : firstError as string);
        } else {
          this.toastr.error(
            err?.error?.message ||
            err?.error?.Message ||
            err?.error?.title ||
            'Registration failed'
          );
        }

      }

    });

  }

  gotoLogin() {
    this.router.navigate(['/login']);
  }

}
