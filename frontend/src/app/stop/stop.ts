import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

declare let L: any;

@Component({
  selector: 'app-stop',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './stop.html'
})
export class Stop implements AfterViewInit {

  map: any;
  marker: any;

  /* ================= FORM DATA ================= */

  stopName = '';
  latitude: number | null = null;
  longitude: number | null = null;

  /* ================= SEARCH (MAP) ================= */

  locationQuery = '';
  suggestions: any[] = [];
  private searchTimer: any;
  private lastQuery = '';

  /* ================= MANAGE STOPS ================= */

  stops: any[] = [];
  stopSearch = '';
  editingStopId: number | null = null;
  loadingStops = false;
  isSaving = false;

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService
  ) { }

  /* ================= MAP INIT ================= */

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();

      setTimeout(() => {
        if (this.map && typeof this.map.invalidateSize === 'function') {
          this.map.invalidateSize(true);
        }
      }, 300);

    }, 0);

    this.loadStops();
  }
  private reverseGeocode(lat: number, lon: number): void {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Navoyage-Stop-Selector/1.0'
        }
      }
    )
      .then(res => res.json())
      .then(data => {
        if (!data || !data.display_name) return;

        // Full address in search box
        this.locationQuery = data.display_name;

        // Short meaningful name for stop
        this.stopName =
          data.address?.neighbourhood ||
          data.address?.suburb ||
          data.address?.road ||
          data.address?.village ||
          data.address?.town ||
          data.address?.city ||
          data.display_name.split(',')[0];
      })
      .catch(() => {
        this.toastr.warning('Unable to fetch location name');
      });
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      this.setMarker(lat, lng);
      this.editingStopId = null;
      this.suggestions = [];

      this.reverseGeocode(lat, lng);
    });

  }

  private refreshMap(): void {
    if (!this.map) return;

    setTimeout(() => {
      if (typeof this.map.invalidateSize === 'function') {
        this.map.invalidateSize(true);
      }
    }, 200);
  }

  private setMarker(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    this.map.setView([lat, lng], 14);
    this.refreshMap();
  }

  /* ================= LOCATION SEARCH ================= */

  searchLocation(): void {
    const query = this.locationQuery.trim();

    if (query.length < 3) {
      this.suggestions = [];
      return;
    }

    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.fetchLocations(query), 300);
  }

  private fetchLocations(query: string): void {
    this.lastQuery = query;

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=in`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Navoyage-Stop-Selector/1.0'
        }
      }
    )
      .then(res => res.json())
      .then(data => {
        if (this.locationQuery.trim() !== this.lastQuery) return;
        this.suggestions = data || [];
      })
      .catch(() => this.toastr.error('Location search failed'));
  }

  selectSuggestion(place: any): void {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    this.setMarker(lat, lon);
    this.stopName = place.display_name.split(',')[0];
    this.locationQuery = place.display_name;
    this.suggestions = [];
  }

  /* ================= SAVE / UPDATE ================= */

  saveStop(): void {
    if (!this.stopName || this.latitude == null || this.longitude == null) {
      this.toastr.warning('Select location and provide stop name');
      return;
    }

    const payload = {
      stopName: this.stopName,
      latitude: this.latitude,
      longitude: this.longitude
    };

    this.isSaving = true;

    if (this.editingStopId) {
      this.api.updateStop(this.editingStopId, payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;

          if (res.status) {
            this.toastr.success('Stop updated');
            this.reset();
            this.loadStops();
          }
          else {
            this.toastr.error(res.message);
          }
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to update stop');
        }
      });
    } else {
      this.api.createStop(payload).subscribe({
        next: res => {
          this.isSaving = false;

          if (res?.status) {
            this.toastr.success('Stop created');
            this.reset();
            this.loadStops();
          } else {
            this.toastr.error(res.message);
          }
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to create stop');
        }
      });
    }
  }

  /* ================= MANAGE STOPS ================= */

  loadStops(): void {
    this.loadingStops = true;

    this.api.getAllStops().subscribe({
      next: res => {
        this.loadingStops = false;

        if (res?.status) {
          this.stops = res.data || [];
        } else {
          this.toastr.error(res?.message || 'Failed to load stops');
        }
      },
      error: () => {
        this.loadingStops = false;
        this.toastr.error('Failed to load stops');
      }
    });
  }

  get filteredStops(): any[] {
    if (!this.stopSearch.trim()) return this.stops;

    const q = this.stopSearch.toLowerCase();
    return this.stops.filter(s =>
      s.stopName?.toLowerCase().includes(q) ||
      String(s.stopId ?? '').includes(q)
    );
  }

  get coordinateText(): string {
    if (this.latitude == null || this.longitude == null) {
      return 'No location selected';
    }

    return `${this.latitude.toFixed(5)}, ${this.longitude.toFixed(5)}`;
  }

  get selectedStopLabel(): string {
    return this.editingStopId ? 'Editing stop' : 'New stop';
  }

  get totalStops(): number {
    return this.stops.length;
  }

  get filteredStopCount(): number {
    return this.filteredStops.length;
  }

  clearStopSearch(): void {
    this.stopSearch = '';
  }

  selectFirstSuggestion(): void {
    if (this.suggestions.length) {
      this.selectSuggestion(this.suggestions[0]);
    }
  }

  focusStop(stop: any): void {
    if (stop?.latitude == null || stop?.longitude == null) return;

    this.setMarker(stop.latitude, stop.longitude);
    this.locationQuery = stop.stopName;
    this.stopName = stop.stopName;
    this.suggestions = [];
  }

  trackByStopId(_: number, stop: any): number {
    return stop.stopId;
  }

  editStop(stop: any): void {
    this.editingStopId = stop.stopId;
    this.stopName = stop.stopName;
    this.locationQuery = stop.stopName;
    this.setMarker(stop.latitude, stop.longitude);
  }

  deleteStop(id: number): void {
    if (!confirm('Delete this stop?')) return;

    this.api.deleteStop(id).subscribe((res:any) => {
      if(res.status){
      this.toastr.success('Stop deleted');
      this.loadStops();
      }
      else{
        this.toastr.error(res.message);
      }
    });

  }

  /* ================= RESET ================= */

  reset(): void {
    this.stopName = '';
    this.locationQuery = '';
    this.latitude = null;
    this.longitude = null;
    this.suggestions = [];
    this.editingStopId = null;

    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }
}
