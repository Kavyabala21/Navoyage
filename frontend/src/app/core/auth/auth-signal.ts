import { Injectable, signal, computed } from '@angular/core';
import { User } from './user';

@Injectable({ providedIn: 'root' })
export class AuthSignal {

  private _user = signal<User | null>(null);
  private _ready = signal(false);

  user = this._user.asReadonly();
  ready = this._ready.asReadonly();
  isLoggedIn = computed(() => this._user() !== null);
  role = computed(() => this._user()?.role ?? null);

  private SESSION_KEY = 'auth_session';
  private TOKEN_KEY = 'token';
  private SESSION_DURATION = 1 * 60 * 60 * 1000;

  /* ---------------- LOGIN ---------------- */

  setUser(user: User) {
    this._user.set(user);
    this._ready.set(true);

    const expiry = Date.now() + this.SESSION_DURATION;

    sessionStorage.setItem(
      this.SESSION_KEY,
      JSON.stringify({ user, expiry })
    );

    // Remove any previously persisted login from old builds.
    localStorage.removeItem(this.SESSION_KEY);
  }

  /* ---------------- RESTORE ---------------- */

  restoreFromStorage() {
    const session = sessionStorage.getItem(this.SESSION_KEY);
    if (!session) {
      // Clear stale persisted auth from previous localStorage-based versions.
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      this._ready.set(true);
      return;
    }

    const parsed = JSON.parse(session);

    if (Date.now() > parsed.expiry) {
      this.clear();
      return;
    }

    this._user.set(parsed.user);
    this._ready.set(true);
  }

  /* ---------------- CLEAR ---------------- */

  clear() {
    this._user.set(null);
    this._ready.set(true);
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /* ---------------- TOKEN ---------------- */

  setToken(token: string) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
   updateUser(partial: Partial<User>) {
    const current = this._user();
    if (!current) return;

    this._user.set({
      ...current,
      ...partial
    });

    this._ready.set(true);
  }
}
