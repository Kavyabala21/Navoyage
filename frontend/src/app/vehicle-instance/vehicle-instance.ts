import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle-instance',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: 'vehicle-instance.html'
})
export class VehicleInstance implements OnInit {

  today = new Date().toISOString().split('T')[0];

  isEditMode = false;
  dateError = false;
  seatError = false;

  model: any = {
    instanceId: null,
    vehicleId: 0,
    routeId: 0,
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    totalSeats: 0,
    availableSeats: 0,
    status: 'Scheduled'
  };

  routes: any[] = [];

  constructor(
    private api: Api_Calls,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {

      if (params['vehicleId']) {
        this.model.vehicleId = Number(params['vehicleId']);
        this.loadVehicleCapacity(this.model.vehicleId);
      }

      if (params['instanceId']) {
        this.isEditMode = true;
        this.loadInstance(Number(params['instanceId']));
      }
    });

    this.loadRoutes();
  }

  /* ---------------- ROUTES ---------------- */
  loadRoutes(): void {
    this.api.getRoutes().subscribe({
      next: (res: any) => this.routes = res?.data || [],
      error: () => this.toastr.error('Failed to load routes')
    });
  }

  loadVehicleCapacity(vehicleId: number): void {
    this.api.getVehicleById(vehicleId).subscribe({
      next: (res: any) => {
        const capacity = res?.data?.capacity || 0;
        this.model.totalSeats = capacity;
        this.model.availableSeats = capacity;
        this.seatError = false;
      },
      error: () => this.toastr.error('Failed to load vehicle capacity')
    });
  }

  /* ---------------- LOAD INSTANCE ---------------- */
  loadInstance(id: number): void {
    this.api.getVehicleInstanceById(id).subscribe({
      next: (res: any) => {
        const d = res?.data;

        if (!d) {
          this.toastr.warning('Instance details are not available');
          return;
        }

        this.model = {
          instanceId: d.instanceId,
          vehicleId: d.vehicleId,
          routeId: Number(d.routeId),
          departureDate: d.departureDate?.split('T')[0] || '',
          departureTime: this.trimSeconds(d.departureTime),
          arrivalDate: d.arrivalDate?.split('T')[0] || '',
          arrivalTime: this.trimSeconds(d.arrivalTime),
          totalSeats: d.totalSeats,
          availableSeats: d.availableSeats,
          status: d.status
        };
      },
      error: () => this.toastr.error('Failed to load instance')
    });
  }

  /* ---------------- TIME HELPERS ---------------- */
  private normalizeTime(time: string): string {
    if (!time) return '00:00:00';
    return time.length === 5 ? `${time}:00` : time;
  }

  private trimSeconds(time: string): string {
    return time ? time.split(':').slice(0, 2).join(':') : '';
  }

  /* ---------------- DATE + TIME VALIDATION (FINAL FIX) ---------------- */
  validateDates(): void {
    const {
      departureDate,
      arrivalDate,
      departureTime,
      arrivalTime
    } = this.model;

    if (!departureDate || !arrivalDate) {
      this.dateError = false;
      return;
    }

    // Case 1: arrival date before departure date
    if (arrivalDate < departureDate) {
      this.dateError = true;
      return;
    }

    // Case 2: same date → compare time
    if (arrivalDate === departureDate) {
      const [depH, depM] = (departureTime || '00:00').split(':').map(Number);
      const [arrH, arrM] = (arrivalTime || '00:00').split(':').map(Number);

      const depMinutes = depH * 60 + depM;
      const arrMinutes = arrH * 60 + arrM;

      this.dateError = arrMinutes <= depMinutes;
      return;
    }

    // Case 3: arrival date after departure date
    this.dateError = false;
  }

  /* ---------------- SEAT VALIDATION ---------------- */
  validateAvailableSeats(): void {
    this.seatError = this.model.availableSeats > this.model.totalSeats;
  }

  syncAvailableSeats(): void {
    this.model.availableSeats = this.model.totalSeats;
    this.seatError = false;
  }

  /* ---------------- SUBMIT ---------------- */
  submit(): void {
    if (this.dateError || this.seatError) return;

    /* ================= ADD INSTANCE ================= */
    if (!this.isEditMode) {
      const payload = {
        vehicleId: Number(this.model.vehicleId),
        routeId: Number(this.model.routeId),
        departureDate: this.model.departureDate,
        arrivalDate: this.model.arrivalDate,
        departureTime: this.normalizeTime(this.model.departureTime),
        arrivalTime: this.normalizeTime(this.model.arrivalTime),
        totalSeats: Number(this.model.totalSeats),
        availableSeats: Number(this.model.availableSeats),
        status: this.model.status || 'Scheduled'
      };

      this.api.addVehicleInstance(payload).subscribe({
        next: (res: any) => {
          if(res.status){
          this.toastr.success('Vehicle instance added successfully');
          this.router.navigate(['/allvehicles']);
          }
          else{
            this.toastr.error(res.message);
          }
        },
        error: () => this.toastr.error('Failed to add vehicle instance')
      });

      return;
    }

    /* ================= UPDATE INSTANCE ================= */
    const updatePayload = {
      instanceId: this.model.instanceId,
      vehicleId: Number(this.model.vehicleId),
      routeId: Number(this.model.routeId),
      departureDate: this.model.departureDate,
      arrivalDate: this.model.arrivalDate,
      departureTime: this.normalizeTime(this.model.departureTime),
      arrivalTime: this.normalizeTime(this.model.arrivalTime),
      totalSeats: Number(this.model.totalSeats),
      availableSeats: Number(this.model.availableSeats),
      status: this.model.status
    };

    this.api.updateVehicleInstance(updatePayload).subscribe({
      next: () => {
        this.toastr.success('Vehicle instance updated successfully');
        this.router.navigate(['/allvehicles']);
      },
      error: () => this.toastr.error('Failed to update vehicle instance')
    });
  }

  goBack(): void {
    this.router.navigate(['/allvehicles']);
  }
}
