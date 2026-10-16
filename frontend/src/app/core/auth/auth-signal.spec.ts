import { TestBed } from '@angular/core/testing';
import { AuthSignal } from './auth-signal';
import { User } from './user';

describe('AuthSignal Service', () => {

  let service: AuthSignal;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'User',
    phoneNumber: '9876543210',
    isLoggedIn: true,
    InLoginPage: false
  };

  beforeEach(() => {

    TestBed.configureTestingModule({});

    service = TestBed.inject(AuthSignal);

    localStorage.clear();
    sessionStorage.clear();
  });

  /* ---------------- LOGIN ---------------- */

  it('should set user and store session', () => {

    service.setUser(mockUser);

    expect(service.user()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toBe('User');
    expect(service.ready()).toBeTrue();

    const session = JSON.parse(
      sessionStorage.getItem('auth_session')!
    );

    expect(session.user).toEqual(mockUser);
  });

  /* ---------------- RESTORE ---------------- */

  it('should restore session from storage', () => {

    const session = {
      user: mockUser,
      expiry: Date.now() + 10000
    };

    sessionStorage.setItem(
      'auth_session',
      JSON.stringify(session)
    );

    service.restoreFromStorage();

    expect(service.user()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.ready()).toBeTrue();
  });

  it('should clear expired session', () => {

    const session = {
      user: mockUser,
      expiry: Date.now() - 10000
    };

    sessionStorage.setItem(
      'auth_session',
      JSON.stringify(session)
    );

    service.restoreFromStorage();

    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should handle missing session in storage', () => {

    service.restoreFromStorage();

    expect(service.ready()).toBeTrue();
    expect(service.user()).toBeNull();
  });

  /* ---------------- CLEAR ---------------- */

  it('should clear user and remove session', () => {

    service.setUser(mockUser);
    service.setToken('abc123');

    service.clear();

    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(sessionStorage.getItem('auth_session')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  /* ---------------- TOKEN ---------------- */

  it('should set token', () => {

    service.setToken('abc123');

    expect(sessionStorage.getItem('token')).toBe('abc123');
  });

  it('should get token', () => {

    sessionStorage.setItem('token', 'xyz123');

    const token = service.getToken();

    expect(token).toBe('xyz123');
  });

  it('should return null if token missing', () => {

    const token = service.getToken();

    expect(token).toBeNull();
  });

  it('should return true if token exists', () => {

    sessionStorage.setItem('token', 'abc');

    expect(service.hasToken()).toBeTrue();
  });

  it('should return false if token does not exist', () => {

    expect(service.hasToken()).toBeFalse();
  });

  /* ---------------- UPDATE USER ---------------- */

  it('should update user details', () => {

    service.setUser(mockUser);

    service.updateUser({ name: 'Updated Name' });

    expect(service.user()?.name).toBe('Updated Name');
    expect(service.user()?.email).toBe(mockUser.email);
  });

  it('should return if user does not exist during update', () => {

    service.updateUser({ name: 'Updated Name' });

    expect(service.user()).toBeNull();
  });

});
