import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'pnr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'pnr.html'
})
export class pnr implements OnInit, OnDestroy {

  pnr: string = '';
  booking: any = null;
  loading = false;

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {

    const storedPNR = sessionStorage.getItem('pnr');

    if (storedPNR) {
      this.pnr = storedPNR;
      this.searchPNR();   // auto search
    }
  }

  /* ================= SEARCH ================= */

  searchPNR() {

    if (!this.pnr) {
      this.toastr.error('Enter PNR number');
      return;
    }

    //  Store latest PNR
    sessionStorage.setItem('pnr', this.pnr);

    this.loading = true;

    this.api.getByPNR(this.pnr).subscribe({
      next: (res: any) => {

        if (res?.status) {
          this.booking = res.data;
        } else {
          this.booking = null;
          this.toastr.error('PNR not found');
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error fetching booking');
      }
    });
  }
/* Allow only digits while typing */
allowOnlyNumbers(event: KeyboardEvent) {
  if (
    !/^[0-9]$/.test(event.key) &&
    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)
  ) {
    event.preventDefault();
  }
}

sanitizePNR() {
  this.pnr = this.pnr.replace(/[^0-9]/g, '').slice(0, 10);
}

blockNonNumericPaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') || '';

  if (!/^[0-9]+$/.test(pasted)) {
    event.preventDefault();
  }
}
  ngOnDestroy(): void {
    sessionStorage.removeItem('pnr');
  }
}