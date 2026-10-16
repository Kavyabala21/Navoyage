import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataFacade } from '../../Shared/Services/data-fascade';
import { AuthSignal } from '../core/auth/auth-signal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-all-vehicles',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatTooltipModule],
  templateUrl: './all-vehicles.html'
})
export class AllVehicles implements OnInit, OnDestroy {

  // Used to unsubscribe from observables on component destroy
  private destroy$ = new Subject<void>();
seatLayoutExists: { [vehicleId: number]: boolean } = {};
  // Data collections
  vehicleInstances: any[] = [];
  vehicles: any[] = [];
  ownerVehicles: any[] = [];
  filteredVehicles: any[] = [];
  verificationStatus: any[] = [];
  vehicleDocuments: any[] = [];

  // UI state variables
  loading = false;
  ownerId: number | null = null;
  modeOfTransport = '';
  vehicleId: number | null = null;
  showInstancesModal = false;
  instancesLoading = false;

  // UI selection controls
  openMenuFor: string | null = null;
  selectedVehicleForInstances: any | null = null;
  selectedVehicle: any | null = null;

  // Filter fields
  searchText = '';
  statusFilter = '';
  verificationFilter = '';

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private facade: DataFacade,
    private authSignal: AuthSignal,
    private apiCalls: Api_Calls
  ) {}

  /* ================= INIT ================= */

  // Initialize component and subscribe to required data streams
  ngOnInit(): void {

    const user = this.authSignal.user();

    // Ensure valid logged-in owner
    if (!user?.id) {
      this.toastr.error('Owner session not found. Please sign in again.');
      return;
    }

    this.ownerId = user.id;
    this.modeOfTransport = sessionStorage.getItem('transportMode') || '';
    this.loading = true;

    // Subscribe to vehicles stream
    this.facade.vehicles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(allVehicles => {

        this.vehicles = allVehicles || [];

        // Filter vehicles belonging to current owner and mode
       this.ownerVehicles = this.vehicles.filter(v =>
  v.travelCompany?.ownerId === this.ownerId &&
  v.modeOfTransport === this.modeOfTransport
);

// Check seat layout existence
this.ownerVehicles.forEach(v => {
  this.apiCalls.getSeatLayoutByVehicleId(v.vehicleId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.seatLayoutExists[v.vehicleId] = !!res?.data?.layoutJSON;
      },
      error: () => {
        this.seatLayoutExists[v.vehicleId] = false;
      }
    });
});

        this.applyFilters();
        this.loading = false;
      });

    // Subscribe to vehicle documents stream
    this.facade.vehicleDocuments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(docs => {
        this.vehicleDocuments = docs || [];
        this.applyFilters();
      });

    // Subscribe to vehicle instances stream
    this.facade.vehicleInstances$
      .pipe(takeUntil(this.destroy$))
      .subscribe(instances => {
        this.vehicleInstances = instances || [];
        this.instancesLoading = false;
      });

    // Trigger initial vehicle load
    this.facade.loadAllVehicles();
  }

  // Clean up subscriptions when component is destroyed
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ================= VEHICLE DETAILS ================= */

  // Open vehicle details modal and load its documents
  openVehicleDetails(vehicle: any): void {
    this.selectedVehicle = vehicle;
    this.facade.loadVehicleDocuments(vehicle.vehicleId);
  }

  /* ================= VEHICLE INSTANCES ================= */

  // Open instances modal and fetch instances for selected vehicle
  openVehicleInstances(vehicle: any): void {
    this.selectedVehicleForInstances = vehicle;
    this.showInstancesModal = true;
    this.instancesLoading = true;
    this.facade.loadVehicleInstancesByVehicleId(vehicle.vehicleId);
  }

  // Close instances modal and reset related data
  closeInstancesModal(): void {
    this.showInstancesModal = false;
    this.vehicleInstances = [];
    this.selectedVehicleForInstances = null;
  }

  /* ================= FILTERS ================= */

  // Apply search, status, and verification filters
  applyFilters(): void {

    // Filter vehicles list
    this.filteredVehicles = this.ownerVehicles.filter(v => {

      const matchesSearch =
        !this.searchText ||
        v.vehicleModel?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        v.vehicleCode?.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesStatus =
        !this.statusFilter ||
        (this.statusFilter === 'active' && v.isActive) ||
        (this.statusFilter === 'inactive' && !v.isActive);

      return matchesSearch && matchesStatus;
    });

    // Filter verification status list
    this.verificationStatus = this.vehicleDocuments.filter(v => {

      const matchesVerification =
        !this.verificationFilter ||
        (this.verificationFilter === 'approved' && v.status === 'Approved') ||
        (this.verificationFilter === 'pending' && v.status === 'Pending') ||
        (this.verificationFilter === 'rejected' && v.status === 'Rejected');

      return matchesVerification;
    });
  }

  /* ================= VEHICLE ACTIONS ================= */

  // Confirm before deactivating a vehicle
  confirmDeactivate(vehicle: any): void {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate vehicle "${vehicle.vehicleCode}"?`
    );

    if (!confirmed) return;

    this.deactivateVehicle(vehicle.vehicleId);
  }

  // Deactivate vehicle and update local state
  deactivateVehicle(vehicleId: number): void {
    this.facade.deactivateVehicle(vehicleId);

    const v = this.ownerVehicles.find(x => x.vehicleId === vehicleId);
    if (v) v.isActive = false;

    this.applyFilters();
  }

  /* ================= NAVIGATION ================= */

  // Navigate to vehicle edit page
  editVehicle(vehicleId: number): void {
    this.router.navigate(['/vehicles'], {
      queryParams: { id: vehicleId, mode: 'vehicle' }
    });
  }

  // Navigate to document edit page
  editDocuments(vehicleId: number): void {
    this.router.navigate(['/vehicles'], {
      queryParams: { id: vehicleId, mode: 'document' }
    });
  }

  // Toggle action dropdown menu
  toggleMenu(vehicleCode: string): void {
    this.openMenuFor = this.openMenuFor === vehicleCode ? null : vehicleCode;
  }

  // Open vehicle detail modal
  viewDetails(vehicle: any): void {
    this.selectedVehicle = vehicle;
    this.openMenuFor = null;
  }

  // Close vehicle detail modal
  closeModal(): void {
    this.selectedVehicle = null;
  }

  // Construct full image URL
  getImage(url: string): string {
    return `${environment.backendBaseUrl}${url}`;
  }

  // Navigate back to dashboard
  gotohome(): void {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/dashboard']);
  }

  // Navigate to add vehicle instance page
  addInstance(vehicleId: number): void {
    this.router.navigate(['/vehicleinstance'], {
      queryParams: { vehicleId }
    });
  }

  // Navigate to edit vehicle instance page
  editInstance(vehicleId: number): void {
    this.router.navigate(['/vehicleinstance'], {
      queryParams: { vehicleId }
    });
  }

  // Navigate to manage vehicle instances page
  manageVehicleInstance(vehicleId: number): void {
    this.router.navigate(['/managevehicleinstance'], {
      queryParams: { vehicleId }
    });
  }

  // Navigate to seat layout configuration page
  gotoSeatLayout(vehicleId: number, isEdit: boolean): void {
    this.router.navigate(['/seatlayout'], {
      queryParams: { vehicleId, edit: isEdit }
    });
  }
gotoTrainPrices(vehicleId: number): void {

  this.router.navigate(['/trainprices'], {
    queryParams: { vehicleId }
  });

}
}
