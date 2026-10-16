import { ComponentFixture, TestBed } from '@angular/core/testing';

import { pnr } from './pnr';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

describe('PNR', () => {
  let component: pnr;
  let fixture: ComponentFixture<pnr>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', ['getByPNR']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['error']);
    apiSpy.getByPNR.and.returnValue(of({ status: true, data: null }));

    await TestBed.configureTestingModule({
      imports: [pnr],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(pnr);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-search stored PNR on init', () => {
    sessionStorage.setItem('pnr', '1234567890');
    spyOn(component, 'searchPNR');

    component.ngOnInit();

    expect(component.pnr).toBe('1234567890');
    expect(component.searchPNR).toHaveBeenCalled();
  });

  it('should show error when PNR is empty', () => {
    component.pnr = '';

    component.searchPNR();

    expect(toastrSpy.error).toHaveBeenCalledWith('Enter PNR number');
  });

  it('should store PNR and set booking on successful search', () => {
    apiSpy.getByPNR.and.returnValue(of({ status: true, data: { bookingId: 1 } }));
    component.pnr = '1234567890';

    component.searchPNR();

    expect(sessionStorage.getItem('pnr')).toBe('1234567890');
    expect(component.booking).toEqual({ bookingId: 1 });
    expect(component.loading).toBeFalse();
  });

  it('should show not found when search returns unsuccessful status', () => {
    apiSpy.getByPNR.and.returnValue(of({ status: false }));
    component.pnr = '1234567890';

    component.searchPNR();

    expect(component.booking).toBeNull();
    expect(toastrSpy.error).toHaveBeenCalledWith('PNR not found');
    expect(component.loading).toBeFalse();
  });

  it('should show error when search request fails', () => {
    apiSpy.getByPNR.and.returnValue(throwError(() => new Error('fail')));
    component.pnr = '1234567890';

    component.searchPNR();

    expect(toastrSpy.error).toHaveBeenCalledWith('Error fetching booking');
    expect(component.loading).toBeFalse();
  });

  it('should allow only digits and navigation keys', () => {
    const numericEvent = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault'], { key: '5' });
    const backspaceEvent = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault'], { key: 'Backspace' });

    component.allowOnlyNumbers(numericEvent);
    component.allowOnlyNumbers(backspaceEvent);

    expect(numericEvent.preventDefault).not.toHaveBeenCalled();
    expect(backspaceEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should block non-numeric keys', () => {
    const invalidEvent = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault'], { key: 'A' });

    component.allowOnlyNumbers(invalidEvent);

    expect(invalidEvent.preventDefault).toHaveBeenCalled();
  });

  it('should sanitize PNR to digits only with max length 10', () => {
    component.pnr = '12ab34!567890';

    component.sanitizePNR();

    expect(component.pnr).toBe('1234567890');
  });

  it('should block non-numeric paste', () => {
    const event = jasmine.createSpyObj<ClipboardEvent>('ClipboardEvent', ['preventDefault'], {
      clipboardData: {
        getData: () => '12AB'
      } as unknown as DataTransfer
    });

    component.blockNonNumericPaste(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow numeric paste', () => {
    const event = jasmine.createSpyObj<ClipboardEvent>('ClipboardEvent', ['preventDefault'], {
      clipboardData: {
        getData: () => '123456'
      } as unknown as DataTransfer
    });

    component.blockNonNumericPaste(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should remove stored PNR on destroy', () => {
    sessionStorage.setItem('pnr', '1234567890');

    component.ngOnDestroy();

    expect(sessionStorage.getItem('pnr')).toBeNull();
  });
});
