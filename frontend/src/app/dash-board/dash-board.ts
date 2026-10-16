import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from "@angular/cdk/a11y";
import { DataFacade } from '../../Shared/Services/data-fascade';
import { AuthSignal } from '../core/auth/auth-signal';
import { ChangeDetectorRef } from '@angular/core';
import { Api_Calls } from '../../Shared/Services/api-calls';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    A11yModule
  ],
  templateUrl: './dash-board.html'
})
export class Dashboard implements OnInit, OnDestroy {
  private authSignal = inject(AuthSignal);
  // ===== AI ASSISTANT =====
  showAiModal = false;
  totalBookings: number = 0;
  aiForm = {
    destination: '',
    days: 1,
    food: '',
    budget: ''
  };
  // ==============speech ===========
  speakingIndex: number | null = null;
  isSpeaking = false;
  recognition: any;
  isListening = false;
  isMicActive = false;
  chatMessages: any[] = [];
  userInput = '';
  isTyping = false;

  chatHistory: any[] = [];

  defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e';

  eventSource: any;
  private generationTimer: ReturnType<typeof setInterval> | null = null;


  /* ================= USER ================= */
  username: string | null = null;
  email: string | null = null;
  role: string | null = null;
  isLoggedIn = false;
  showErrors = false;
  /* ================= DATE ================= */
  minDate!: string;

  showLocationPopup = false;
  locationFetched = false;
  /* ================= SEARCH INPUTS ================= */
  fromPlace = '';
  toPlace = '';
  departureDate = '';
  selectedMode = '';

  /* ================= DATA ================= */
  stops: any[] = [];

  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private facade: DataFacade,
    private api_calls: Api_Calls,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    //  CLEAR SEARCH SESSION ON DASHBOARD LOAD / REFRESH
    sessionStorage.removeItem('fromStopId');
    sessionStorage.removeItem('toStopId');
    sessionStorage.removeItem('fromPlace');
    sessionStorage.removeItem('toPlace');
    sessionStorage.removeItem('departureDate');

    this.loadUser();
    this.setMinDate();
    this.loadStops();
    this.loadTotalBookings();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUser();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    this.stopGenerationAnimation();
  }
  // ================= TOTAL BOOKINGS ====================
  loadTotalBookings() {
    this.api_calls.getTotalBookings().subscribe({
      next: (res: any) => {
        this.totalBookings = res.data;
        return res.data;
      },
      error: (err) => {
        console.error('Error fetching total bookings', err);
      }
    });
  }
  /* ================= USER ================= */
  loadUser(): void {
    const user = this.authSignal.user();

    this.username = user?.name ?? null;
    this.email = user?.email ?? null;
    this.role = user?.role ?? null;
    this.isLoggedIn = user?.isLoggedIn ?? false;

    if (this.isLoggedIn && this.role === 'Customer') {
      const alreadyAsked = localStorage.getItem('locationPermissionAsked');

      if (!alreadyAsked) {
        this.showLocationPopup = true;
      }
    }
  }
  /* ================= DATE ================= */
  setMinDate(): void {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  /* ================= STOPS ================= */

  loadStops(): void {
    this.facade.loadAllStops();

    this.facade.stops$.subscribe(stops => {
      this.stops = stops || [];
    });
  }

  /* ================= SEARCH ================= */
  search(): void {
    this.showErrors = true;

    if (!this.fromPlace || !this.toPlace || !this.departureDate || !this.selectedMode) {
      return;
    }

    const fromStop = this.stops.find(s => s.stopName === this.fromPlace);
    const toStop = this.stops.find(s => s.stopName === this.toPlace);

    if (!fromStop || !toStop) {
      this.toastr.error('Invalid From / To location');
      return;
    }

    if (fromStop.stopId === toStop.stopId) {
      this.toastr.warning('From and To locations should be different.');
      return;
    }

    //  Store search parameters
    sessionStorage.setItem('transportMode', this.selectedMode);
    sessionStorage.setItem('fromStopId', fromStop.stopId.toString());
    sessionStorage.setItem('toStopId', toStop.stopId.toString());
    sessionStorage.setItem('fromPlace', this.fromPlace);
    sessionStorage.setItem('toPlace', this.toPlace);
    sessionStorage.setItem('departureDate', this.departureDate);

    // Navigate only
    this.router.navigate(['/search']);
  }
  /* ================= QUICK MODE ================= */
  openModeSearch(mode: string): void {
    sessionStorage.setItem('transportMode', mode);
    sessionStorage.removeItem('searchResults');
    this.router.navigate(['/search']);
  }

  /* ================= NAVIGATION ================= */
  gotovehicles(mode: string): void {
    sessionStorage.setItem('transportMode', mode);
    sessionStorage.removeItem('editMode');
    sessionStorage.removeItem('editVehicleId');
    this.router.navigate(['/vehicles']);
  }

  veiwAllVehicles(mode: string): void {
    sessionStorage.setItem('transportMode', mode);
    this.router.navigate(['/allvehicles']);
  }

  adminControls(mode: string): void {
    sessionStorage.setItem('transportMode', mode);
    this.router.navigate(['/admincontrols']);
  }

  gotosearch(mode: string): void {
    sessionStorage.setItem('transportMode', mode);
    this.router.navigate(['/search']);
  }
  gotohelp() {
    this.router.navigate(['/help']);
  }
  allowLocation(): void {
    localStorage.setItem('locationPermissionAsked', 'true');
    if (!navigator.geolocation) {
      this.toastr.error('Geolocation not supported');
      this.showLocationPopup = false;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const locationData = {
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem('userLocation', JSON.stringify(locationData));

        this.showLocationPopup = false;
      },

      (error) => {
        switch (error.code) {

          case error.PERMISSION_DENIED:
            this.toastr.error('Permission denied. Please allow location access.');
            break;

          case error.POSITION_UNAVAILABLE:
            this.toastr.error('Unable to detect location. Try turning on location services or WiFi.');
            break;

          case error.TIMEOUT:
            this.toastr.error('Location request timed out. Try again.');
            break;

          default:
            this.toastr.error('Unknown location error.');
        }

        this.showLocationPopup = false;
      },

      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  denyLocation(): void {
    localStorage.setItem('locationPermissionAsked', 'true');
    this.showLocationPopup = false;
  }
  sendMessage() {
    if (!this.userInput) return;

    const destination = this.userInput;

    this.chatHistory.push({
      text: destination,
      places: [],
      isUser: true
    });

    this.userInput = '';

    this.chatHistory.push({
      text: "Generating your travel plan... ✨",
      places: []
    });

    this.startStreaming(destination);
  }
  startStreaming(destination: string) {
    const cleanDestination = this.cleanPlaceTitle(destination) || destination;

    const payload = {
      destination: cleanDestination,
      days: 2,
      foodPreference: 'none',
      budget: '5000'
    };

    this.isTyping = true;

    this.api_calls.generateTrip(payload).subscribe({
      next: (res: any) => {

        const data = res.data ? res.data : res;

        const trip = this.normalizeTrip(data);

        const places = (data.places || [])
          .filter((p: any) => p.image && !p.image.includes(this.defaultImage))
          .map((p: any) => ({
            name: this.cleanPlaceTitle(p.name || ''),
            image: p.image
          }))
          .filter((p: any) => p.name);

        const message: any = {
          text: trip ? '' : data.planText,
          places: places
        };

        // Keep the original response shape for older API responses, while
        // giving structured AI responses a proper presentation in the chat.
        if (trip) {
          this.animateTripPlan(message, trip, cleanDestination, places);
        } else {
          this.isTyping = false;
        }

        this.chatHistory[this.chatHistory.length - 1] = message;

      },
      error: () => {
        this.stopGenerationAnimation();
        this.isTyping = false;
        const fallback = this.buildFallbackTrip(cleanDestination);
        const fallbackMessage = {
          text: fallback.planText,
          places: fallback.places
        };

        if (this.chatHistory.length === 0) {
          this.chatHistory.push(fallbackMessage);
          return;
        }

        this.chatHistory[this.chatHistory.length - 1] = fallbackMessage;
      }
    });
  }

  private animateTripPlan(message: any, trip: any, destination: string, placeCards: any[]): void {
    this.stopGenerationAnimation();

    const summary = trip.summary || `Here is a thoughtful 2-day plan for ${destination}.`;
    const fullLists = {
      places: [...trip.places],
      food: [...trip.food],
      hotels: [...trip.hotels]
    };
    const visibleTrip = {
      ...trip,
      summary: '',
      places: [],
      food: [],
      hotels: []
    };

    message.trip = visibleTrip;
    message.text = '';
    message.places = [];
    this.isTyping = true;

    let summaryIndex = 0;
    let listIndex = 0;
    let ticksAfterSummary = 0;
    const sections: Array<keyof typeof fullLists> = ['places', 'food', 'hotels'];

    this.generationTimer = setInterval(() => {
      if (summaryIndex < summary.length) {
        visibleTrip.summary += summary.charAt(summaryIndex++);
        return;
      }

      ticksAfterSummary++;
      if (ticksAfterSummary % 5 !== 0) return;

      while (listIndex < sections.length) {
        const section = sections[listIndex];
        if (visibleTrip[section].length < fullLists[section].length) {
          const itemIndex = visibleTrip[section].length;
          visibleTrip[section].push(fullLists[section][itemIndex]);
          if (section === 'places' && placeCards[itemIndex]) {
            message.places.push(placeCards[itemIndex]);
          }
          return;
        }
        listIndex++;
      }

      message.text = summary;
      this.isTyping = false;
      this.stopGenerationAnimation();
    }, 28);
  }

  private stopGenerationAnimation(): void {
    if (this.generationTimer) {
      clearInterval(this.generationTimer);
      this.generationTimer = null;
    }
  }

  private normalizeTrip(data: any): any | null {
    let source = data || {};

    // Some deployments return the model JSON as planText. Parse it only for
    // rendering; the API can continue to keep planText for compatibility.
    if (typeof source.planText === 'string') {
      try {
        const parsed = JSON.parse(source.planText);
        if (parsed && typeof parsed === 'object') {
          source = { ...parsed, ...source };
        }
      } catch {
        // planText is regular text in fallback/legacy responses.
      }
    }

    const places = source.PLACES || source.places;
    const food = source.FOOD || source.food;
    const hotels = source.HOTELS || source.hotels;
    const budget = source.BUDGET || source.budget;
    const summary = source.RETURN || source.returnSuggestion;

    if (!Array.isArray(places) && !Array.isArray(food) && !Array.isArray(hotels) && !budget && !summary) {
      return null;
    }

    return {
      places: (places || []).map((item: any) => typeof item === 'string' ? item : item.name || item.title).filter(Boolean),
      food: (food || []).map((item: any) => typeof item === 'string' ? item : item.dish || item.name).filter(Boolean),
      hotels: (hotels || []).map((item: any) => typeof item === 'string' ? item : item.name || item.title).filter(Boolean),
      budget: budget || 'Medium',
      summary: summary || ''
    };
  }

  private buildFallbackTrip(destination: string) {
    const cleanDestination = this.cleanPlaceTitle(destination) || destination;

    return {
      planText: `PLACES:
- ${cleanDestination} city center
- ${cleanDestination} local market
- ${cleanDestination} heritage area
FOOD:
- Local breakfast
- Regional thali
- Popular street food
BUDGET: Medium budget plan for 2 day(s).
RETURN: Keep the plan flexible and confirm timings before travel.`,
      places: [
        {
          name: `${cleanDestination} city center`,
          image: this.defaultImage
        },
        {
          name: `${cleanDestination} local market`,
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'
        },
        {
          name: `${cleanDestination} heritage area`,
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'
        }
      ]
    };
  }

  private cleanPlaceTitle(value: string): string {
    const withoutPunctuation = value.replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    const destinationMatch = withoutPunctuation.match(/\b(?:to|in|for|at|visit|visiting|explore|tour)\s+([a-zA-Z][a-zA-Z\s]*)$/i);
    const candidate = destinationMatch ? destinationMatch[1] : withoutPunctuation;
    const cleaned = candidate.replace(/\b(?:i|want|please|kindly|can|you|create|make|plan|suggest|give|show|me|go|to|in|for|at|a|an|the|trip|travel|tour|vacation|holiday|journey|itinerary|places|place|days?|day|food|hotel|hotels|budget|medium|low|high|with|and|about)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || value;
  }
  openAiModal() {
    this.showAiModal = true;
    this.startChat();
  }
  startChat() {
    this.chatHistory = [];

    this.chatHistory.push({
      text: "Hi 👋 I am Vay. Your travel partner.",
      places: []
    });

    this.chatHistory.push({
      text: "Where do you want to go?",
      places: []
    });
  }
  speak(text: string, index: number) {
    if (!text) return;

    //  If same speaker clicked again - STOP
    if (this.speakingIndex === index) {
      window.speechSynthesis.cancel();
      this.speakingIndex = null;
      return;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-IN';

    this.speakingIndex = index;

    speech.onend = () => {
      this.speakingIndex = null;
    };

    window.speechSynthesis.speak(speech);
  }
  startVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported");
      return;
    }

    this.recognition = new SpeechRecognition();

    this.recognition.lang = 'en-IN';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.isMicActive = true;
    this.isListening = true;



    this.recognition.onresult = (event: any) => {

      let transcript = '';

      // Only take latest result (IMPORTANT)
      const current = event.results[event.resultIndex];

      if (current.isFinal) {
        transcript = current[0].transcript;
      } else {
        transcript = current[0].transcript;
      }

      // Update input field LIVE
      this.userInput = transcript.trim();
      this.userInput = transcript.trim();
      this.cd.detectChanges();
    };

    this.recognition.onerror = () => {
      this.stopVoiceInput();
    };

    this.recognition.onend = () => {
      this.isMicActive = false;
      this.isListening = false;
    };

    this.recognition.start();
  }
  stopVoiceInput() {
    if (this.recognition && this.isMicActive) {
      this.recognition.stop();
    }

    this.isMicActive = false;
    this.isListening = false;
  }

  toggleVoice() {
    if (this.isMicActive) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }
  closeAiModal() {
    this.showAiModal = false;
  }
}
