import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DataFacade } from '../../Shared/Services/data-fascade';

interface Country {
  name: string;
  code: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: '../../styles.scss'
})
export class Login implements OnInit, OnDestroy {
  form!: FormGroup;
  showPassword = false;
  mode: 'username' | 'email' | 'phone' | '' = 'email';
  countries: Country[] = [];
  isLoading = false;
  private loadingSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private facade: DataFacade,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.loadingSubscription = this.facade.loading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    this.loadCountries();
    this.form = this.fb.group({
      loginMode: ['email'],
      loginIdentifier: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
          Validators.pattern(/^\S+$/)
        ]
      ],
      username: [''],
      email: [''],
      countryCode: [''],
      localPhone: ['+91-'],
      phoneNumber: [''],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^\S+$/) // no spaces allowed
        ]
      ]
    });
  }

  ngOnDestroy(): void {
    this.loadingSubscription?.unsubscribe();
  }

  loadCountries() {
    this.http
      .get<Country[]>('../../Assets/Data/Country-codes.json')
      .subscribe(res => this.countries = res);
  }

  lockPhonePrefix(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;

    if (input.selectionStart !== null && input.selectionStart < 4) {
      event.preventDefault();
    }
  }

  onModeChange() {
    this.mode = this.form.value.loginMode;

    this.form.patchValue({
      username: '',
      email: '',
      localPhone: '+91-',
      phoneNumber: '',
      loginIdentifier: ''
    });
  }

  sanitizePhone(): void {
    const control = this.form.get('localPhone');
    if (!control) return;

    let value = control.value || '';

    if (!value.startsWith('+91-')) {
      value = '+91-';
    }

    let digits = value.substring(4).replace(/[^0-9]/g, '');
    digits = digits.substring(0, 10);

    control.setValue('+91-' + digits, { emitEvent: false });
  }

  mergePhone() {
    const phone = this.form.value.localPhone;

    if (phone) {
      this.form.patchValue(
        { phoneNumber: phone },
        { emitEvent: false }
      );
    }
  }
  allowOnlyNumbers(event: KeyboardEvent) {

    const key = event.key;

    if (!/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
      event.preventDefault();
    }

  }
  blockNonNumeric(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab'
    ];
    if (allowedKeys.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }
  fieldError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) {
      if (field === 'loginIdentifier') return 'Email, phone number, or username is required';
      if (field === 'password') return 'Password is required';
    }
    if (c.errors['minlength'])
      return 'Minimum length not met';
    if (c.errors['maxlength'])
      return 'Maximum length exceeded';
    if (c.errors['pattern']) {
      if (field === 'loginIdentifier')
        return 'Login id cannot contain spaces';
      if (field === 'username')
        return 'Username cannot contain spaces or special characters';
      if (field === 'email')
        return 'Enter a valid email address';
      if (field === 'localPhone')
        return 'Enter a valid Indian mobile number (10 digits starting with 6–9)';
      if (field === 'password') {

        if (c.errors['required'])
          return 'Password is required';
        if (c.errors['pattern'])
          return 'Password cannot contain spaces';
      }
    }
    return '';
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  onLogin() {
    if (this.isLoading) return;

    const loginIdentifier = this.getLoginIdentifier();
    this.form.patchValue(
      { loginIdentifier },
      { emitEvent: false }
    );

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      LoginIdentifier: loginIdentifier,
      Password: this.form.value.password
    };

    this.facade.loginUser(payload);
  }
  modenotset() {
    if (!this.mode) {
      this.toastr.warning('Please select a login Method.');
    }
  }

  private getLoginIdentifier(): string {
    const identifier = this.form.value.loginIdentifier?.trim();
    if (identifier) return identifier;

    if (this.mode === 'username') {
      return this.form.value.username?.trim() ?? '';
    }

    if (this.mode === 'email') {
      return this.form.value.email?.trim() ?? '';
    }

    if (this.mode === 'phone') {
      this.mergePhone();
      return this.form.value.phoneNumber?.trim() ?? '';
    }

    return '';
  }

  signup() {

    this.router.navigate(['/register']);
  }
}
