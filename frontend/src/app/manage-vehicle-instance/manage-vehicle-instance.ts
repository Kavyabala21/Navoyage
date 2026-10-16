import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-manage-vehicle-instances',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: 'manage-vehicle-instance.html'
})
export class ManageVehicleInstance implements OnInit {

  vehicleId!: number;

  vehicleInstances: any[] = [];
  loading = false;

  /** ROUTE LOOKUP */
  routes: any[] = [];
  routeMap: { [key: number]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (!params['vehicleId']) {
        this.toastr.error('Vehicle not selected');
        this.router.navigate(['/my-vehicles']);
        return;
      }

      this.vehicleId = +params['vehicleId'];

      // Load both in parallel
      this.loadRoutes();
      this.loadInstances();
    });
  }

  /* ================= ROUTES ================= */
  loadRoutes(): void {
    this.api.getRoutes().subscribe({
      next: (res: any) => {
        this.routes = res?.data || [];

        // Build lookup map
        this.routeMap = {};
        for (const r of this.routes) {
          this.routeMap[r.routeId] = r.routeName;
        }
      },
      error: () => {
        this.toastr.error('Failed to load routes');
      }
    });
  }

  /* ================= INSTANCES ================= */
  loadInstances(): void {
    this.loading = true;
    this.vehicleInstances = [];

    this.api.getVehicleInstanceByVehicleId(this.vehicleId).subscribe({
      next: (res: any) => {
        const data = res?.data;
         console.log(data);
        if (Array.isArray(data)) {
          this.vehicleInstances = data;
        } else if (data) {
          this.vehicleInstances = [data];
        } else {
          this.vehicleInstances = [];
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.vehicleInstances = [];
        this.toastr.error('Failed to load vehicle instances');
      }
    });
  }

  /* ================= ACTIONS ================= */
  editInstance(instanceId: number): void {
    this.router.navigate(['/vehicleinstance'], {
      queryParams: { instanceId }
    });
  }

  confirmDelete(instance: any): void {
    const ok = window.confirm(
      `Are you sure you want to remove this instance?\n\nInstance ID: ${instance.instanceId}`
    );

    if (!ok) return;

    this.api.deleteVehicleInstance(instance.instanceId).subscribe({
      next: (res: any) => {
        if(res.status){
        this.toastr.success('Instance removed successfully');
        this.vehicleInstances = this.vehicleInstances.filter(
          i => i.instanceId !== instance.instanceId
        );
      }
      else{
        this.toastr.error(res.message);
      }
      },
      error: () => {
        this.toastr.error('Failed to remove instance');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/allvehicles']);
  }
}
