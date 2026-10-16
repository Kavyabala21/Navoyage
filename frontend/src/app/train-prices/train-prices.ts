import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TrainSeatType {
  type: string;
  count: number;
  BasePrice: number;
}

@Component({
  selector: 'app-train-prices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'train-prices.html'
})
export class TrainPrices implements OnInit {

  vehicleId!: number;
  capacity = 0;
  isEditMode = false;

  seatTypes: TrainSeatType[] = [
    { type: 'GENERAL', count: 0, BasePrice: 0 },
    { type: 'SLEEPER', count: 0, BasePrice: 0 },
    { type: '3AC', count: 0, BasePrice: 0 },
    { type: '2AC', count: 0, BasePrice: 0 },
    { type: '1AC', count: 0, BasePrice: 0 }
  ];

  constructor(
    private route: ActivatedRoute,
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId'));

    this.loadVehicleCapacity();
    this.loadExistingPrices();
  }

  /* ================= LOAD VEHICLE ================= */

  loadVehicleCapacity() {

    this.api.getVehicleById(this.vehicleId).subscribe({
      next: (res: any) => {
        this.capacity = res?.data?.capacity || 0;
      }
    });

  }

  /* ================= LOAD EXISTING ================= */

  loadExistingPrices() {

    this.api.getSeatLayoutByVehicleId(this.vehicleId).subscribe({
      next: (res: any) => {

        if (!res?.data?.layoutJSON) return;

        const layout = JSON.parse(res.data.layoutJSON);

        if (layout.trainSeats) {
          this.seatTypes = layout.trainSeats;
          this.isEditMode = true;
        }
      },
      error: () => {
        // no layout yet
      }
    });

  }

  /* ================= HELPERS ================= */

  get totalSeats(): number {
    return this.seatTypes.reduce((sum, s) => sum + Number(s.count || 0), 0);
  }

  /* ================= SAVE ================= */

  savePrices() {

    if (this.totalSeats !== this.capacity) {
      this.toastr.error(`Total seats must equal vehicle capacity (${this.capacity})`);
      return;
    }

    const layout = {
      vehicleId: this.vehicleId,
      transportMode: 'TRAIN',
      capacity: this.capacity,
      trainSeats: this.seatTypes
    };

    const payload = {
      vehicleId: this.vehicleId,
      layoutJSON: JSON.stringify(layout)
    };

    if (this.isEditMode) {

      this.api.updateSeatLayout(this.vehicleId, payload.layoutJSON)
        .subscribe(() => {
          this.toastr.success('Train prices updated');
        });

    } else {

      this.api.saveSeatLayout(payload)
        .subscribe(() => {
          this.toastr.success('Train prices saved');
          this.isEditMode = true;
        });

    }

  }

  goback() {
    this.router.navigate(['/allvehicles']);
  }

}