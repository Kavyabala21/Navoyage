import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Help } from './help';
import { Router } from '@angular/router';

describe('Help Component', () => {

  let component: Help;
  let fixture: ComponentFixture<Help>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Help],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Help);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  /* ---------------- CREATE ---------------- */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ---------------- BACK TO HOME ---------------- */

  it('should remove transportMode from sessionStorage and navigate to dashboard', () => {

    sessionStorage.setItem('transportMode', 'Bus');

    component.backtohome();

    expect(sessionStorage.getItem('transportMode')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  /* ---------------- METHOD EXECUTION ---------------- */

  it('should call router navigate when backtohome is triggered', () => {

    component.backtohome();

    expect(routerSpy.navigate).toHaveBeenCalled();
  });

});