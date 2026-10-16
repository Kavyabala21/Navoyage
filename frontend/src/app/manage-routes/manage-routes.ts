import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
@Component({
  selector: 'app-route-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'manage-routes.html'
})
export class ManageRoutes implements OnInit {
  routeSearch: string = '';
  stopSearch: string = '';

  filteredRoutes: any[] = [];
  filteredStops: any[] = [];
  routes: any[] = [];
  stops: any[] = [];
  selectedStops: any[] = [];

  routeName: string = '';
  editingRouteId: number | null = null;

  formVisible: boolean = true;
  isEditMode: boolean = false;
  selectedRoute: any = null;

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRoutes();
    this.loadStops();
  }
  loadRoutes() {

    this.api.getRoutesByOwnerId().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.routes = res.data || [];
          this.filteredRoutes = [...this.routes];
        }
        else {
          this.toastr.error(this.getResponseMessage(res, 'Failed to load routes'));
        }
      },
      error: () => {
        this.toastr.error('Failed to load routes');
      }
    });

  }

  loadStops() {

    this.api.getAllStops().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.stops = res.data || [];
          this.filteredStops = [...this.stops];
        }
        else {
          this.toastr.error(this.getResponseMessage(res, 'Failed to load stops'));
        }
      },
      error: () => {
        this.toastr.error('Failed to load stops');
      }
    });

  }
  searchRoutes() {

    if (!this.routeSearch) {

      this.filteredRoutes = [...this.routes];
      return;

    }

    const search = this.routeSearch.toLowerCase();

    this.filteredRoutes = this.routes.filter(route =>
      route.routeName?.toLowerCase().includes(search) ||
      route.routeId?.toString().includes(search)
    );

  }
  searchStops() {

    if (!this.stopSearch) {

      this.filteredStops = [...this.stops];
      return;

    }

    const search = this.stopSearch.toLowerCase();

    this.filteredStops = this.stops.filter(stop =>
      stop.stopName?.toLowerCase().includes(search)
    );

  }
  selectRoute(route: any) {
    this.selectedRoute = route;
  }

  enableAdd() {
    this.resetForm();
    this.formVisible = true;
    this.isEditMode = false;
  }

  enableEdit() {
    if (!this.selectedRoute) {
      this.toastr.warning('Select a route first');
      return;
    }

    this.formVisible = true;
    this.isEditMode = true;
    this.editRoute(this.selectedRoute);
  }

  cancelForm() {
    this.formVisible = true;
    this.isEditMode = false;
    this.resetForm();
  }

  addStop(stop: any) {
    if (this.selectedStops.find(s => s.stopId === stop.stopId)) {
      this.toastr.warning('Stop already added');
      return;
    }

    this.selectedStops.push({
      ...stop,
      sequenceOrder: this.selectedStops.length + 1
    });
  }

  removeStop(index: number) {
    this.selectedStops.splice(index, 1);
    this.reorderStops();
  }

  moveUp(index: number) {
    if (index === 0) return;
    [this.selectedStops[index], this.selectedStops[index - 1]] =
      [this.selectedStops[index - 1], this.selectedStops[index]];
    this.reorderStops();
  }

  moveDown(index: number) {
    if (index === this.selectedStops.length - 1) return;
    [this.selectedStops[index], this.selectedStops[index + 1]] =
      [this.selectedStops[index + 1], this.selectedStops[index]];
    this.reorderStops();
  }

  reorderStops() {
    this.selectedStops.forEach((s, i) => {
      s.sequenceOrder = i + 1;
    });
  }
  saveRoute(): void {
    if (!this.routeName.trim() || this.selectedStops.length < 2) {
      this.toastr.error('Route name and at least 2 stops required');
      return;
    }



    const routePayload = {
      routeName: this.routeName
    };

    // ============================
    // CREATE ROUTE
    // ============================
    if (this.editingRouteId === null) {

      this.api.addRoute(routePayload).subscribe({
        next: (res: any) => {
          if (!res?.status) {
            this.toastr.error(this.getResponseMessage(res, 'Failed to create route'));
            return;
          }

          const routeId: number = res?.data?.routeId;

          if (!routeId) {
            this.toastr.error('Invalid route ID returned from server');
            return;
          }

          this.saveStopPoints(routeId);
        },
        error: () => {
          this.toastr.error('Failed to create route');
        }
      });

    }

    // ============================
    // UPDATE ROUTE
    // ============================
    else {

      const routeId: number = this.editingRouteId;

      this.api.updateRoute({
        routeId: routeId,
        routeName: this.routeName
      }).subscribe({

        next: (res: any) => {
          if (!res?.status) {
            this.toastr.error(this.getResponseMessage(res, 'Failed to update route'));
            return;
          }
          this.api.getRouteStopPointsByRouteId(routeId).subscribe({

            next: (spRes: any) => {

              if (!spRes?.status) {
                this.toastr.error(
                  this.getResponseMessage(spRes, 'Failed to load existing stop points')
                );
                return;
              }

              const existing = spRes?.data || [];

              if (existing.length === 0) {
                this.saveStopPoints(routeId);
                return;
              }

              const deleteCalls = existing.map((x: any) =>
                this.api.deleteRouteStopPoint(x.routeStopPointId)
              );

              forkJoin(deleteCalls).subscribe({

                next: (deleteResponses: any) => {

                  const responses = deleteResponses as any[];

                  const failed = responses.find((r: any) => !r?.status);

                  if (failed) {
                    this.toastr.error(
                      this.getResponseMessage(
                        failed,
                        'Failed to remove old stop points'
                      )
                    );
                    return;
                  }

                  this.saveStopPoints(routeId);
                },

                error: () => {
                  this.toastr.error('Failed to remove old stop points');
                }

              });

            },

            error: () => {
              this.toastr.error('Failed to load existing stop points');
            }

          });

        },
        error: () => {
          this.toastr.error('Failed to update route');
        }

      });

    }
  }


  saveStopPoints(routeId: number): void {

    const requests = this.selectedStops.map(s =>
      this.api.addRouteStopPoint({
        routeId: routeId,
        stopId: s.stopId,
        sequenceOrder: s.sequenceOrder
      })
    );

    if (requests.length === 0) {
      this.toastr.error('No stops selected');
      return;
    }

 forkJoin(requests).subscribe({

  next: (responses: any) => {

    const result = responses as any[];

    const failed = result.find((r: any) => !r?.status);

    if (failed) {
      this.toastr.error(
        this.getResponseMessage(failed, 'Failed to save stop points')
      );
      return;
    }

    this.toastr.success('Route saved successfully');
    this.resetForm();
    this.loadRoutes();
  },

  error: () => {
    this.toastr.error('Failed to save stop points');
  }

});
  }


  editRoute(route: any) {

    this.editingRouteId = route.routeId;
    this.routeName = route.routeName;
    this.selectedStops = [];

    this.api.getRouteStopPointsByRouteId(route.routeId).subscribe({
      next: (res: any) => {
        if (!res?.status) {
          this.toastr.error(this.getResponseMessage(res, 'Failed to load route stop points'));
          return;
        }

        const stopsForRoute = (res.data || [])
          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder);

        this.selectedStops = stopsForRoute.map((x: any) => ({
          stopId: x.stopId,
          stopName: x.stop?.stopName,
          sequenceOrder: x.sequenceOrder
        }));
      },
      error: () => {
        this.toastr.error('Failed to load route stop points');
      }
    });
  }

  resetForm() {
    this.routeName = '';
    this.selectedStops = [];
    this.editingRouteId = null;
  }

  gotoStops() {
    this.router.navigate(['/stop']);
  }

  private getResponseMessage(res: any, fallback: string): string {
    return res?.message || res?.Message || fallback;
  }
}

