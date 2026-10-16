import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Dashboard } from './dash-board';
import { ToastrService } from 'ngx-toastr';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { AuthSignal } from '../core/auth/auth-signal';
import { Api_Calls } from 'src/Shared/Services/api-calls';

describe('Dashboard', () => {

  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let facadeSpy: any;
  let authSpy: any;
  let apiCallsSpy: jasmine.SpyObj<Api_Calls>;
  let routerEvents$: Subject<any>;
  let cdSpy: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {

    routerEvents$ = new Subject<any>();
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: routerEvents$.asObservable() });

    toastrSpy = jasmine.createSpyObj('ToastrService', ['error', 'warning']);

    facadeSpy = {
      loadAllStops: jasmine.createSpy('loadAllStops'),
      stops$: of([
        { stopId: 1, stopName: 'A' },
        { stopId: 2, stopName: 'B' }
      ])
    };

    authSpy = {
      user: jasmine.createSpy().and.returnValue({
        name: 'John',
        email: 'john@test.com',
        role: 'User',
        isLoggedIn: true
      })
    };

    apiCallsSpy = jasmine.createSpyObj('Api_Calls', ['getTotalBookings', 'generateTrip']);
    apiCallsSpy.getTotalBookings.and.returnValue(of({ status: true, data: 0 }));
    apiCallsSpy.generateTrip.and.returnValue(of({ data: { planText: '', places: [] } }));
    cdSpy = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: DataFacade, useValue: facadeSpy },
        { provide: AuthSignal, useValue: authSpy },
        { provide: Api_Calls, useValue: apiCallsSpy },
        { provide: ChangeDetectorRef, useValue: cdSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    routerEvents$.complete();
    window.speechSynthesis.cancel();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* USER */

  it('should load user', () => {

    component.loadUser();

    expect(component.username).toBe('John');
    expect(component.email).toBe('john@test.com');
    expect(component.role).toBe('User');
    expect(component.isLoggedIn).toBeTrue();
  });

  /* DATE */

  it('should set min date', () => {

    component.setMinDate();

    expect(component.minDate).toBeDefined();
  });

  /* STOPS */

  it('should load stops', () => {

    component.loadStops();

    expect(component.stops.length).toBe(2);
  });

  /* SEARCH VALIDATION */

  it('should return when inputs missing', () => {

    component.search();

    expect(component.showErrors).toBeTrue();
  });

  it('should show error when stop not found', () => {

    component.fromPlace = 'X';
    component.toPlace = 'Y';
    component.departureDate = '2026-03-10';
    component.selectedMode = 'Bus';
    component.stops = [];

    component.search();

    expect(toastrSpy.error).toHaveBeenCalledWith('Invalid From / To location');
  });

  it('should show warning when same stop selected', () => {

    component.fromPlace = 'A';
    component.toPlace = 'A';
    component.departureDate = '2026-03-10';
    component.selectedMode = 'Bus';

    component.stops = [{ stopId: 1, stopName: 'A' }];

    component.search();

    expect(toastrSpy.warning).toHaveBeenCalledWith(
      'From and To locations should be different.'
    );
  });

  it('should navigate when search valid', () => {

    component.fromPlace = 'A';
    component.toPlace = 'B';
    component.departureDate = '2026-03-10';
    component.selectedMode = 'Bus';

    component.stops = [
      { stopId: 1, stopName: 'A' },
      { stopId: 2, stopName: 'B' }
    ];

    component.search();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
  });

  /* QUICK MODE */

  it('should open mode search', () => {

    component.openModeSearch('Bus');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
  });

  /* VEHICLE NAVIGATION */

  it('should go to vehicles', () => {

    component.gotovehicles('Bus');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/vehicles']);
  });

  it('should view all vehicles', () => {

    component.veiwAllVehicles('Bus');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/allvehicles']);
  });

  it('should open admin controls', () => {

    component.adminControls('Bus');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admincontrols']);
  });

  it('should go to search', () => {

    component.gotosearch('Bus');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
  });

  it('should go to help', () => {

    component.gotohelp();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/help']);
  });
/* ================= NGONINIT ================= */

it('should clear session storage and call init methods', () => {

  spyOn(component, 'loadUser');
  spyOn(component, 'setMinDate');
  spyOn(component, 'loadStops');

  sessionStorage.setItem('fromStopId', '1');
  sessionStorage.setItem('toStopId', '2');

  component.ngOnInit();

  expect(sessionStorage.getItem('fromStopId')).toBeNull();
  expect(sessionStorage.getItem('toStopId')).toBeNull();

  expect(component.loadUser).toHaveBeenCalled();
  expect(component.setMinDate).toHaveBeenCalled();
  expect(component.loadStops).toHaveBeenCalled();
});


/* ================= ROUTER SUBSCRIPTION ================= */

it('should subscribe to router events in ngOnInit', () => {

  spyOn(component, 'loadUser');
  component.ngOnInit();
  routerEvents$.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

  expect(component['routerSub']).toBeDefined();
  expect(component.loadUser).toHaveBeenCalledTimes(2);
});


/* ================= NGONDESTROY ================= */

it('should unsubscribe routerSub on destroy', () => {

  component.ngOnInit();

  spyOn(component['routerSub'], 'unsubscribe');

  component.ngOnDestroy();

  expect(component['routerSub'].unsubscribe).toHaveBeenCalled();
});

it('should set total bookings on successful load', () => {
  apiCallsSpy.getTotalBookings.and.returnValue(of({ data: 23 }));

  component.loadTotalBookings();

  expect(component.totalBookings).toBe(23);
});

it('should log an error when total bookings fails', () => {
  const consoleSpy = spyOn(console, 'error');
  apiCallsSpy.getTotalBookings.and.returnValue(throwError(() => new Error('fail')));

  component.loadTotalBookings();

  expect(consoleSpy).toHaveBeenCalled();
});

it('should show location popup for logged-in customer when not already asked', () => {
  authSpy.user.and.returnValue({
    name: 'Jane',
    email: 'jane@test.com',
    role: 'Customer',
    isLoggedIn: true
  });

  component.loadUser();

  expect(component.showLocationPopup).toBeTrue();
});

it('should not show location popup for customer if already asked', () => {
  localStorage.setItem('locationPermissionAsked', 'true');
  authSpy.user.and.returnValue({
    name: 'Jane',
    email: 'jane@test.com',
    role: 'Customer',
    isLoggedIn: true
  });

  component.loadUser();

  expect(component.showLocationPopup).toBeFalse();
});

it('should deny location and close popup', () => {
  component.showLocationPopup = true;

  component.denyLocation();

  expect(localStorage.getItem('locationPermissionAsked')).toBe('true');
  expect(component.showLocationPopup).toBeFalse();
});

it('should handle missing geolocation support', () => {
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined
  });

  component.showLocationPopup = true;
  component.allowLocation();

  expect(toastrSpy.error).toHaveBeenCalledWith('Geolocation not supported');
  expect(component.showLocationPopup).toBeFalse();

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should store location when geolocation succeeds', () => {
  const getCurrentPosition = jasmine.createSpy('getCurrentPosition').and.callFake((success: any) => {
    success({ coords: { latitude: 12.34, longitude: 56.78 } });
  });
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });

  component.showLocationPopup = true;
  component.allowLocation();

  expect(getCurrentPosition).toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('userLocation') || '{}')).toEqual(
    jasmine.objectContaining({ latitude: 12.34, longitude: 56.78 })
  );
  expect(component.showLocationPopup).toBeFalse();

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should handle geolocation permission denied error', () => {
  const getCurrentPosition = jasmine.createSpy('getCurrentPosition').and.callFake((success: any, error: any) => {
    error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });

  component.allowLocation();

  expect(toastrSpy.error).toHaveBeenCalledWith('Permission denied. Please allow location access.');
  expect(component.showLocationPopup).toBeFalse();

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should handle geolocation position unavailable error', () => {
  const getCurrentPosition = jasmine.createSpy('getCurrentPosition').and.callFake((success: any, error: any) => {
    error({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });

  component.allowLocation();

  expect(toastrSpy.error).toHaveBeenCalledWith('Unable to detect location. Try turning on location services or WiFi.');

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should handle geolocation timeout error', () => {
  const getCurrentPosition = jasmine.createSpy('getCurrentPosition').and.callFake((success: any, error: any) => {
    error({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });

  component.allowLocation();

  expect(toastrSpy.error).toHaveBeenCalledWith('Location request timed out. Try again.');

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should handle unknown geolocation error', () => {
  const getCurrentPosition = jasmine.createSpy('getCurrentPosition').and.callFake((success: any, error: any) => {
    error({ code: 99, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  const originalGeolocation = navigator.geolocation;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });

  component.allowLocation();

  expect(toastrSpy.error).toHaveBeenCalledWith('Unknown location error.');

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation
  });
});

it('should start chat when AI modal is opened', () => {
  component.openAiModal();

  expect(component.showAiModal).toBeTrue();
  expect(component.chatHistory.length).toBe(2);
  expect(component.chatHistory[0].text).toContain('Hi');
});

it('should not send a message when input is empty', () => {
  spyOn(component, 'startStreaming');

  component.userInput = '';
  component.sendMessage();

  expect(component.startStreaming).not.toHaveBeenCalled();
  expect(component.chatHistory.length).toBe(0);
});

it('should append user and loading messages when sending chat input', () => {
  spyOn(component, 'startStreaming');

  component.userInput = 'Goa';
  component.sendMessage();

  expect(component.chatHistory.length).toBe(2);
  expect(component.chatHistory[0]).toEqual(jasmine.objectContaining({ text: 'Goa', isUser: true }));
  expect(component.chatHistory[1].text).toContain('Generating your travel plan');
  expect(component.userInput).toBe('');
  expect(component.startStreaming).toHaveBeenCalledWith('Goa');
});

it('should map AI trip response and filter default images', () => {
  component.chatHistory = [{ text: 'Generating...', places: [] }];
  apiCallsSpy.generateTrip.and.returnValue(of({
    data: {
      planText: 'Trip plan',
      places: [
        { name: 'Beach', image: 'https://example.com/beach.jpg' },
        { name: 'Default', image: component.defaultImage }
      ]
    }
  }));

  component.startStreaming('Goa');

  expect(component.isTyping).toBeFalse();
  expect(component.chatHistory[0]).toEqual({
    text: 'Trip plan',
    places: [{ name: 'Beach', image: 'https://example.com/beach.jpg' }]
  });
});

it('should show a fallback trip when AI trip generation fails', () => {
  apiCallsSpy.generateTrip.and.returnValue(throwError(() => new Error('fail')));

  component.startStreaming('Goa');

  expect(component.isTyping).toBeFalse();
  expect(component.chatHistory[0].text).toContain('Goa city center');
  expect(component.chatHistory[0].places.length).toBe(3);
});

it('should start speaking text and clear index on end', () => {
  let utterance: SpeechSynthesisUtterance | undefined;
  spyOn(window.speechSynthesis, 'cancel');
  spyOn(window.speechSynthesis, 'speak').and.callFake((u: SpeechSynthesisUtterance) => {
    utterance = u;
  });

  component.speak('Hello', 1);

  expect(component.speakingIndex).toBe(1);
  expect(window.speechSynthesis.speak).toHaveBeenCalled();

    utterance?.onend?.({} as SpeechSynthesisEvent);
  expect(component.speakingIndex).toBeNull();
});

it('should stop speaking when clicking the same message again', () => {
  component.speakingIndex = 2;
  const cancelSpy = spyOn(window.speechSynthesis, 'cancel');

  component.speak('Hello', 2);

  expect(cancelSpy).toHaveBeenCalled();
  expect(component.speakingIndex).toBeNull();
});

it('should alert when speech recognition is unsupported', () => {
  spyOn(window, 'alert');
  (window as any).SpeechRecognition = undefined;
  (window as any).webkitSpeechRecognition = undefined;

  component.startVoiceInput();

  expect(window.alert).toHaveBeenCalledWith('Voice not supported');
});

it('should start, update, and stop voice input', () => {
  const recognition = {
    lang: '',
    interimResults: false,
    continuous: false,
    onresult: undefined as any,
    onerror: undefined as any,
    onend: undefined as any,
    start: jasmine.createSpy('start'),
    stop: jasmine.createSpy('stop').and.callFake(() => {
      recognition.onend?.();
    })
  };

  (window as any).SpeechRecognition = jasmine
    .createSpy('SpeechRecognition')
    .and.returnValue(recognition);

  component.startVoiceInput();
  expect(component.isMicActive).toBeTrue();
  expect(component.isListening).toBeTrue();

  recognition.onresult({
    resultIndex: 0,
    results: [[{ transcript: 'Hello world' }]]
  });

  expect(component.userInput).toBe('Hello world');

  component.stopVoiceInput();
  expect(recognition.stop).toHaveBeenCalled();
  expect(component.isMicActive).toBeFalse();
  expect(component.isListening).toBeFalse();
});

it('should toggle voice based on mic state', () => {
  spyOn(component, 'startVoiceInput');
  spyOn(component, 'stopVoiceInput');

  component.isMicActive = false;
  component.toggleVoice();
  expect(component.startVoiceInput).toHaveBeenCalled();

  component.isMicActive = true;
  component.toggleVoice();
  expect(component.stopVoiceInput).toHaveBeenCalled();
});

it('should close AI modal', () => {
  component.showAiModal = true;

  component.closeAiModal();

  expect(component.showAiModal).toBeFalse();
});
});
