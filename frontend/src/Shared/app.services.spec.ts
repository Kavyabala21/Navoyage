import { AppService } from './app.services';

describe('AppService', () => {
  afterEach(() => {
    const service = new AppService();
    service.logout();
  });

  it('initializes with logged-out state', () => {
    const service = new AppService();

    service.isLoggedIn$.subscribe(value => expect(value).toBeFalse());
    service.role$.subscribe(value => expect(value).toBeNull());
  });

  it('refreshes login and role state', () => {
    const service = new AppService();

    service.setAuthState(true, 'User');
    service.refresh();

    service.isLoggedIn$.subscribe(value => expect(value).toBeTrue());
    service.role$.subscribe(value => expect(value).toBe('User'));
  });

  it('clears auth state on logout', () => {
    const service = new AppService();
    service.setAuthState(true, 'User');

    service.logout();

    service.isLoggedIn$.subscribe(value => expect(value).toBeFalse());
    service.role$.subscribe(value => expect(value).toBeNull());
  });
});
