import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Notifications } from './notifications';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Notifications Component', () => {

  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'getAllMyNotifications'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'error'
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;

    apiSpy.getAllMyNotifications.and.returnValue(
      of({ status: true, data: [] })
    );
  });

  /* ================= INIT ================= */

  it('should call loadNotifications on init', () => {

    spyOn(component, 'loadNotifications');

    component.ngOnInit();

    expect(component.loadNotifications).toHaveBeenCalled();
  });

  /* ================= LOAD ================= */

  it('should load notifications successfully', () => {

    apiSpy.getAllMyNotifications.and.returnValue(
      of({
        status: true,
        data: [
          { title: 'Test 1', message: 'Message 1' },
          { title: 'Test 2', message: 'Message 2' }
        ]
      })
    );

    component.loadNotifications();

    expect(component.notifications.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should handle notification load error', () => {

    apiSpy.getAllMyNotifications.and.returnValue(
      throwError(() => new Error())
    );

    component.loadNotifications();

    expect(component.loading).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalledWith('Failed to load notifications');
  });

  /* ================= FILTER ================= */

  it('should return all notifications if search empty', () => {

    component.notifications = [
      { title: 'Hello', message: 'World' }
    ];

    component.searchText = '';

    const result = component.filteredNotifications;

    expect(result.length).toBe(1);
  });

  it('should filter notifications by title', () => {

    component.notifications = [
      { title: 'Trip Update', message: 'Vehicle delayed' },
      { title: 'Booking', message: 'Confirmed' }
    ];

    component.searchText = 'trip';

    const result = component.filteredNotifications;

    expect(result.length).toBe(1);
  });

  it('should filter notifications by message', () => {

    component.notifications = [
      { title: 'Trip Update', message: 'Vehicle delayed' },
      { title: 'Booking', message: 'Confirmed' }
    ];

    component.searchText = 'confirmed';

    const result = component.filteredNotifications;

    expect(result.length).toBe(1);
  });

  it('should return empty if no match', () => {

    component.notifications = [
      { title: 'Trip', message: 'Vehicle delayed' }
    ];

    component.searchText = 'xyz';

    const result = component.filteredNotifications;

    expect(result.length).toBe(0);
  });

  /* ================= NAVIGATION ================= */

  it('should navigate back to dashboard', () => {

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

});