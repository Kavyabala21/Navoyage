import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api_Calls } from '../../Shared/Services/api-calls';
@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'ai.html'
})
export class AiComponent {

  aiData: any;
  errorMessage = '';
  isLoading = false;
  destination: string = 'Bangalore';

  constructor(private api: Api_Calls) {}

  loadAI() {
    this.errorMessage = '';
    this.isLoading = true;

    const payload = {
      destination: this.destination,
      days: 2,
      arrivalTime: 'Morning',
      foodPreference: 'Veg',
      budget: 'Medium'
    };

    this.api.generateTrip(payload).subscribe({
      next: (res: any) => {
        this.aiData = res?.data ? res.data : res;
        this.isLoading = false;
      },
      error: () => {
        this.aiData = this.buildFallbackTrip(payload.destination, payload.days, payload.budget);
        this.errorMessage = 'AI service is unavailable. Showing a basic travel plan.';
        this.isLoading = false;
      }
    });
  }

  private buildFallbackTrip(destination: string, days: number, budget: string) {
    return {
      planText: `PLACES:
- ${destination} city center
- ${destination} local market
- ${destination} heritage area
FOOD:
- Local breakfast
- Regional thali
- Popular street food
BUDGET: ${budget} budget plan for ${days} day(s).
RETURN: Keep the plan flexible and confirm timings before travel.`,
      places: [
        {
          name: `${destination} city center`,
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
        },
        {
          name: `${destination} local market`,
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'
        },
        {
          name: `${destination} heritage area`,
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'
        }
      ],
      food: [
        {
          dish: 'Local breakfast',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
        },
        {
          dish: 'Regional thali',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
        },
        {
          dish: 'Popular street food',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1'
        }
      ],
      hotels: [
        `Comfortable stay near ${destination} city center`,
        'Mid-range hotel close to main attractions',
        'Serviced apartment or family stay'
      ],
      budget: `${budget} budget plan for ${days} day(s).`,
      returnSuggestion: 'Keep the plan flexible and confirm timings before travel.'
    };
  }
}
