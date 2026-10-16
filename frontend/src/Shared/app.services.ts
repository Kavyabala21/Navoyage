import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppService {

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();

  setAuthState(isLoggedIn: boolean, role: string | null = null) {
    this.isLoggedInSubject.next(isLoggedIn);
    this.roleSubject.next(role);
  }

  refresh(
    isLoggedIn: boolean = this.isLoggedInSubject.value,
    role: string | null = this.roleSubject.value
  ) {
    this.isLoggedInSubject.next(isLoggedIn);
    this.roleSubject.next(role);
  }

  logout() {
    this.isLoggedInSubject.next(false);
    this.roleSubject.next(null);
  }
}
