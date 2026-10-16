import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiComponent } from './ai';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { of, throwError } from 'rxjs';
describe('Ai', () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;
  let apiSpy: jasmine.SpyObj<Api_Calls>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', ['generateTrip']);
    apiSpy.generateTrip.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [AiComponent],
      providers: [
        { provide: Api_Calls, useValue: apiSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load AI trip data with the expected payload', () => {
    const response = { itinerary: ['Day 1'] };
    apiSpy.generateTrip.and.returnValue(of(response));
    component.destination = 'Chennai';

    component.loadAI();

    expect(apiSpy.generateTrip).toHaveBeenCalledWith({
      destination: 'Chennai',
      days: 2,
      arrivalTime: 'Morning',
      foodPreference: 'Veg',
      budget: 'Medium'
    });
    expect(component.aiData).toEqual(response);
  });

  it('should show fallback AI trip data when the request fails', () => {
    apiSpy.generateTrip.and.returnValue(throwError(() => new Error('fail')));
    component.destination = 'Goa';

    component.loadAI();

    expect(component.aiData.places[0].name).toContain('Goa');
    expect(component.errorMessage).toContain('AI service is unavailable');
    expect(component.isLoading).toBeFalse();
  });
});
