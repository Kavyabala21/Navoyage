import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { Router, NavigationEnd } from '@angular/router';
import { Api_Calls } from '../Shared/Services/api-calls';
import { AuthSignal } from './core/auth/auth-signal';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, throwError } from 'rxjs';

describe('App Component', () => {

  let component: App;
  let fixture: ComponentFixture<App>;

  let routerSpy: jasmine.SpyObj<Router>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let authSpy: jasmine.SpyObj<AuthSignal>;
  let locationSpy: jasmine.SpyObj<Location>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  const routerEvents = new Subject<any>();

  beforeEach(async () => {

    (window as any).NotificationSignalR = {
      start: jasmine.createSpy('start')
    };

    routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigate', 'navigateByUrl'],
      {
        events: routerEvents.asObservable(),
        url: '/dashboard'
      }
    );

    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    routerSpy.navigateByUrl.and.returnValue(Promise.resolve(true));

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getUnreadCount',
      'getMyNotifications',
      'markAsRead'
    ]);

    authSpy = jasmine.createSpyObj<AuthSignal>('AuthSignal', [
      'user',
      'clear',
      'restoreFromStorage',
      'getToken'
    ]);

    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['warning']);

    apiSpy.getUnreadCount.and.returnValue(of({ status: true, data: 5 }));
    apiSpy.getMyNotifications.and.returnValue(of({ status: true, data: [] }));
    apiSpy.markAsRead.and.returnValue(of({}));

    authSpy.user.and.returnValue({
      id: 1,
      name: 'TestUser',
      email: 'test@test.com',
      phoneNumber: '9999999999',
      role: 'Customer',
      isLoggedIn: true,
      InLoginPage: false
    });

    authSpy.getToken.and.returnValue('token123');

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Api_Calls, useValue: apiSpy },
        { provide: AuthSignal, useValue: authSpy },
        { provide: Location, useValue: locationSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    sessionStorage.removeItem('pnr');
    sessionStorage.removeItem('token');
  });

  /* ---------------- BASIC ---------------- */

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user', () => {
    component.loadUser();
    expect(component.username).toBe('TestUser');
  });

  /* ---------------- TOKEN ---------------- */

  it('should logout if token is null', () => {
    authSpy.getToken.and.returnValue(null);

    spyOn(component, 'logout').and.callFake(() => {});

    component.ngOnInit();

    expect(component.logout).toHaveBeenCalled();
  });

  /* ---------------- SIGNALR ---------------- */

  it('should initialize SignalR', () => {
    component.initializeSignalR('token123');
    expect((window as any).NotificationSignalR.start).toHaveBeenCalled();
  });

  it('should initialize SignalR and push notification', () => {

    const startSpy = jasmine.createSpy('start').and.callFake(
      (token: string, onNotify: any, onCount: any) => {
        onNotify({
          notificationId: 1,
          title: 'Test',
          message: 'Hello',
          createdOn: '2024'
        });
        onCount(5);
      }
    );

    (window as any).NotificationSignalR = { start: startSpy };

    component.initializeSignalR('token123');

    expect(component.notifications.length).toBe(1);
    expect(component.unreadCount).toBe(5);
  });

  /* ---------------- ROUTER EVENTS ---------------- */

  it('should handle navigation events and update layout', () => {

    component.isLoggedIn = true;

    spyOn(component, 'initializeSignalR');
    spyOn(component, 'loadUnreadCount');

    routerEvents.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

    expect(component.showHeader).toBeTrue();
    expect(component.showFooter).toBeTrue();
  });

  it('should hide header and footer on login page', () => {
    component.ngOnInit();

    routerEvents.next(new NavigationEnd(1, '/login', '/login'));

    expect(component.inLoginPage).toBeTrue();
    expect(component.showHeader).toBeFalse();
    expect(component.showFooter).toBeFalse();
  });

  /* ---------------- NOTIFICATIONS ---------------- */

  it('should load unread count', () => {
    component.isLoggedIn = true;
    component.loadUnreadCount();
    expect(apiSpy.getUnreadCount).toHaveBeenCalled();
  });

  it('should not load unread count when logged out', () => {
    component.isLoggedIn = false;

    component.loadUnreadCount();

    expect(apiSpy.getUnreadCount).not.toHaveBeenCalled();
  });

  it('should toggle notifications', () => {
    component.toggleNotifications();
    expect(apiSpy.getMyNotifications).toHaveBeenCalled();
  });

  it('should close notifications without fetching when toggled off', () => {
    component.showNotifications = true;

    component.toggleNotifications();

    expect(component.showNotifications).toBeFalse();
    expect(apiSpy.getMyNotifications).not.toHaveBeenCalled();
  });

  it('should mark notification as read', () => {

    const notification = { notificationId: 1, isRead: false };

    component.unreadCount = 3;

    component.markAsRead(notification);

    expect(apiSpy.markAsRead).toHaveBeenCalled();
  });

  it('should not mark notification as read when already read', () => {
    const notification = { notificationId: 1, isRead: true };

    component.markAsRead(notification);

    expect(apiSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('should filter notifications by title and message', () => {
    component.notifications = [
      { title: 'Train delayed', message: 'Platform changed' },
      { title: 'Ticket ready', message: 'Download now' }
    ];
    component.notificationSearch = 'platform';

    const result = component.filteredNotifications();

    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Train delayed');
  });

  it('should return all notifications when search is empty', () => {
    component.notifications = [{ title: 'A', message: 'B' }];

    expect(component.filteredNotifications()).toEqual(component.notifications);
  });

  it('should remove already read notification locally', () => {
    const notification = { notificationId: 1, isRead: true };
    component.notifications = [notification, { notificationId: 2, isRead: false }];

    component.markAndRemove(notification);

    expect(component.notifications.length).toBe(1);
    expect(apiSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('should mark unread notification as read and remove it', () => {
    const notification = { notificationId: 1, isRead: false };
    component.notifications = [notification];
    component.unreadCount = 1;

    component.markAndRemove(notification);

    expect(apiSpy.markAsRead).toHaveBeenCalledWith(1);
    expect(component.notifications.length).toBe(0);
    expect(component.unreadCount).toBe(0);
  });

  it('should navigate directly to notifications page when none are unread', () => {
    component.notifications = [{ notificationId: 1, isRead: true }];

    component.goToNotificationsPage();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/notifications']);
    expect(apiSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('should mark all unread notifications and navigate to notifications page', () => {
    component.notifications = [
      { notificationId: 1, isRead: false },
      { notificationId: 2, isRead: true },
      { notificationId: 3, isRead: false }
    ];
    component.unreadCount = 2;
    component.showNotifications = true;

    component.goToNotificationsPage();

    expect(apiSpy.markAsRead).toHaveBeenCalledTimes(2);
    expect(component.unreadCount).toBe(0);
    expect(component.showNotifications).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  /* ---------------- NAVIGATION ---------------- */

  it('should go to login', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should warn instead of navigating to login when already logged in', () => {
    component.isLoggedIn = true;

    component.goToLogin();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(toastrSpy.warning).toHaveBeenCalledWith('User already logged in');
  });

  it('should navigate to register page', () => {
    component.goToRegister();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should navigate to stops', () => {
    component.gotostops();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/stop']);
  });

  it('should navigate home', () => {
    component.gotohome();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to help and clear transport mode', () => {
    sessionStorage.setItem('transportMode', 'train');

    component.gotohelp();

    expect(sessionStorage.getItem('transportMode')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/help']);
  });

  it('should navigate to bookings and clear transport mode', () => {
    sessionStorage.setItem('transportMode', 'bus');

    component.gotobookings();

    expect(sessionStorage.getItem('transportMode')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/bookings']);
  });

  it('should navigate to user profile and clear transport mode', () => {
    sessionStorage.setItem('transportMode', 'metro');

    component.userprofile();

    expect(sessionStorage.getItem('transportMode')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/userprofile']);
  });

  it('should navigate to routes page', () => {
    component.gotoroutes();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['manageroutes']);
  });

  it('should navigate to logs page', () => {
    component.gotoLogs();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/logs']);
  });

  /* ---------------- ACCOUNT ---------------- */

  it('should open account view', () => {
    component.accountView();
    expect(component.showUserMenu).toBeTrue();
  });

  it('should close account view', () => {
    component.showUserMenu = true;
    component.closeAccountView();
    expect(component.showUserMenu).toBeFalse();
  });

  /* ---------------- HISTORY ---------------- */

  it('should go back using location', () => {

    spyOnProperty(window, 'history').and.returnValue({ length: 2 } as any);

    component.goback();

    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('should navigate to dashboard if no history', () => {

    spyOnProperty(window, 'history').and.returnValue({ length: 1 } as any);

    component.goback();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  /* ---------------- OTHER ---------------- */

  it('should close notifications panel', () => {

    component.showNotifications = true;

    component.closeNotifications();

    expect(component.showNotifications).toBeFalse();
  });

  it('should sanitize PNR input to digits and max length 10', () => {
    component.pnrValue = '12ab34-567890';

    component.onPNRInput();

    expect(component.pnrValue).toBe('1234567890');
  });

  it('should do nothing on empty PNR input', () => {
    component.pnrValue = '';

    component.onPNRInput();

    expect(component.pnrValue).toBe('');
  });

  it('should not search when PNR is invalid', () => {
    sessionStorage.removeItem('pnr');
    component.pnrValue = '12345';

    component.searchPNR();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('pnr')).toBeNull();
  });

  it('should search when PNR is valid and reset input', () => {
    component.pnrValue = '1234567890';

    component.searchPNR();

    expect(sessionStorage.getItem('pnr')).toBe('1234567890');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/pnr']);
    expect(component.pnrValue).toBe('');
  });

  it('should reset auth state on logout and navigate back to dashboard', async () => {
    sessionStorage.setItem('transportMode', 'bus');
    component.username = 'User';
    component.email = 'user@test.com';
    component.role = 'Customer';
    component.isLoggedIn = true;
    component.showUserMenu = true;
    component.showNotifications = true;
    component.unreadCount = 4;

    component.logout();
    await fixture.whenStable();

    expect(component.username).toBeNull();
    expect(component.email).toBeNull();
    expect(component.role).toBeNull();
    expect(component.isLoggedIn).toBeFalse();
    expect(component.showUserMenu).toBeFalse();
    expect(component.showNotifications).toBeFalse();
    expect(component.unreadCount).toBe(0);
    expect(authSpy.clear).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should initialize SignalR and unread count on init when token and user are present', () => {
    spyOn(component, 'initializeSignalR');
    spyOn(component, 'loadUnreadCount');

    component.ngOnInit();

    expect(authSpy.restoreFromStorage).toHaveBeenCalled();
    expect(component.initializeSignalR).toHaveBeenCalledWith('token123');
    expect(component.loadUnreadCount).toHaveBeenCalled();
  });

});
