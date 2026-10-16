import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

type SeatType = 'SEATER' | 'SLEEPER';
type DeckType = 'LOWER' | 'UPPER';
type SeatPosition = 'WINDOW' | 'AISLE' | 'MIDDLE';
type TransportMode = 'BUS' | 'FLIGHT';
type LayoutType = 'BUS_SEATER' | 'BUS_SLEEPER' | 'BUS_MIXED';
type CabinClass = 'BUSINESS' | 'ECONOMY';

@Component({
  selector: 'app-manage-seat-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: 'seat-layout.html',
})
export class SeatLayout implements OnInit {

  vehicleId!: number;
  capacity = 0;

  transportMode: TransportMode = 'BUS';
  isFlight = false;

  rows = 10;
  columns = 4;

  aisleColumn = 2;              // BUS
  aisleColumns: number[] = [];  // FLIGHT
  aisleInput = '';

  businessRows = 0;             // FLIGHT only

  layoutType: LayoutType = 'BUS_SEATER';
  isEditMode = false;

  seats: any[] = [];
  layout: any = null;
  selectedSeat: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId'));
    this.isEditMode = this.route.snapshot.queryParamMap.get('edit') === 'true';

    this.loadTransportMode();
    this.loadVehicleCapacity();

    if (this.isEditMode) {
      this.loadExistingLayout();
    }
  }

  /* ================= LOAD EXISTING ================= */

  loadExistingLayout(): void {
    this.api.getSeatLayoutByVehicleId(this.vehicleId).subscribe({
      next: (res: any) => {

        if (!res?.data?.layoutJSON) {
          this.toastr.warning('No existing layout found');
          return;
        }

        const layout = JSON.parse(res.data.layoutJSON);

        this.layout = layout;
        this.seats = layout.seats || [];
        this.rows = layout.rows;
        this.columns = layout.columns;
        this.transportMode = layout.transportMode;
        this.isFlight = layout.transportMode === 'FLIGHT';
        this.layoutType = layout.layoutType;

        if (this.isFlight) {
          this.aisleColumns = layout.aisleColumns || [];
          this.aisleInput = this.aisleColumns.join(',');
          this.businessRows = layout.businessRows || 0;
        } else {
          this.aisleColumn = layout.aisleColumn || 0;
        }

        this.toastr.success('Existing layout loaded');
      }
    });
  }

  loadTransportMode(): void {
    const mode = sessionStorage.getItem('transportMode');
    if (mode === 'Flight') {
      this.transportMode = 'FLIGHT';
      this.isFlight = true;
      this.aisleColumn = 0;
    } else {
      this.transportMode = 'BUS';
      this.isFlight = false;
    }
  }

  loadVehicleCapacity(): void {
    this.api.getVehicleById(this.vehicleId).subscribe({
      next: (res: any) => this.capacity = res?.data?.capacity || 0
    });
  }

  /* ================= GRID HELPERS ================= */

  getSeat(seats: any[], row: number, column: number) {
    return seats.find(s => s.row === row && s.column === column);
  }

  getGridColumns(): number {
    if (this.isFlight)
      return this.columns + this.aisleColumns.length;

    return this.aisleColumn ? this.columns + 1 : this.columns;
  }

  getGridPosition(column: number): number {

    if (this.isFlight) {
      let shift = 0;
      for (let a of this.aisleColumns)
        if (column > a) shift++;
      return column + shift;
    }

    if (this.aisleColumn && column > this.aisleColumn)
      return column + 1;

    return column;
  }

  get rowArray() {
    return Array.from({ length: this.rows }, (_, i) => i + 1);
  }

  get colArray() {
    return Array.from({ length: this.columns }, (_, i) => i + 1);
  }

  get lowerDeckSeats() {
    return this.seats.filter(s => s.deck === 'LOWER');
  }

  get upperDeckSeats() {
    return this.seats.filter(s => s.deck === 'UPPER');
  }

  getSeatLetter(col: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[col - 1] || `X${col}`;
  }

  /* ================= GENERATE ================= */

  generateSeats(): void {

    this.seats = [];
    let seatNo = 1;

    if (this.isFlight && this.aisleInput) {
      this.aisleColumns = this.aisleInput
        .split(',')
        .map(x => Number(x.trim()))
        .filter(x => !isNaN(x) && x > 0 && x < this.columns)
        .sort((a, b) => a - b);
    }

    for (let r = 1; r <= this.rows; r++) {
      for (let c = 1; c <= this.columns; c++) {

        if (seatNo > this.capacity) break;

        let position: SeatPosition = 'MIDDLE';

        if (this.isFlight) {

          if (c === 1 || c === this.columns)
            position = 'WINDOW';

          else if (
            this.aisleColumns.includes(c) ||
            this.aisleColumns.includes(c - 1)
          )
            position = 'AISLE';

        } else {

          position =
            c === 1 || c === this.columns
              ? 'WINDOW'
              : c === this.aisleColumn
                ? 'AISLE'
                : 'MIDDLE';
        }

        let type: SeatType = 'SEATER';
        let deck: DeckType = 'LOWER';

        if (!this.isFlight) {

          if (this.layoutType === 'BUS_SLEEPER') {
            type = 'SLEEPER';
            deck = r % 2 === 0 ? 'UPPER' : 'LOWER';
          }

          if (this.layoutType === 'BUS_MIXED') {
            type = r <= Math.ceil(this.rows / 2) ? 'SEATER' : 'SLEEPER';
            deck = type === 'SLEEPER' && r % 2 === 0 ? 'UPPER' : 'LOWER';
          }
        }

        const cabinClass: CabinClass =
          this.isFlight && r <= this.businessRows
            ? 'BUSINESS'
            : 'ECONOMY';

        this.seats.push({
          seatNo: this.isFlight
            ? `${r}${this.getSeatLetter(c)}`
            : `S${seatNo}`,
          row: r,
          column: c,
          type,
          deck,
          position,
          cabinClass: this.isFlight ? cabinClass : null,
          BasePrice: this.isFlight
            ? (cabinClass === 'BUSINESS' ? 8 : 3)
            : (type === 'SLEEPER' ? 2 : 1)
        });
        seatNo++;
      }
    }

    this.layout = {
      vehicleId: this.vehicleId,
      transportMode: this.transportMode,
      layoutType: this.isFlight ? 'FLIGHT_LAYOUT' : this.layoutType,
      capacity: this.capacity,
      rows: this.rows,
      columns: this.columns,
      aisleColumn: this.isFlight ? null : this.aisleColumn,
      aisleColumns: this.isFlight ? this.aisleColumns : null,
      businessRows: this.isFlight ? this.businessRows : null,
      seats: this.seats
    };

    this.toastr.success(`${this.seats.length} seats generated`);
  }

  /* ================= MODAL ================= */

  selectSeat(s: any) { this.selectedSeat = s; }
  closeSeatEditor() { this.selectedSeat = null; }

  /* ================= SAVE ================= */

  saveLayout(): void {

    const payload = {
      vehicleId: this.vehicleId,
      layoutJSON: JSON.stringify(this.layout)
    };

    if (this.isEditMode) {
      this.api.updateSeatLayout(this.vehicleId, payload.layoutJSON)
        .subscribe(() => this.toastr.success('Updated successfully'));
    } else {
      this.api.saveSeatLayout(payload)
        .subscribe(() => {
          this.toastr.success('Saved successfully');
          this.isEditMode = true;
        });
    }
  }
  seatClass(s: any) {
    return {
      seater: s.type === 'SEATER',
      sleeper: s.type === 'SLEEPER',
      window: s.position === 'WINDOW',
      aisle: s.position === 'AISLE',
      middle: s.position === 'MIDDLE',
      upper: s.deck === 'UPPER',
      business: s.cabinClass === 'BUSINESS',
      economy: s.cabinClass === 'ECONOMY'
    };
  }

  goback() {
    this.router.navigate(['/allvehicles']);
  }
}
