import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-view-all-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './view-all-documents.html'
})
export class ViewAllDocuments implements OnInit {
  documents: any[] = [];
  loading = false;
  searchText = '';
  statusFilter = '';
  backendUrl = environment.backendBaseUrl;

  constructor(
    private router: Router,
    private api: Api_Calls,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;

    this.api.getAllVehicleDocuments().subscribe({
      next: (res: any) => {
        this.loading = false;
        this.documents = res?.status ? (res.data || []) : [];

        if (!res?.status) {
          this.toastr.error(res?.message || res?.Message || 'Unable to load documents');
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.documents = [];
        this.toastr.error(err?.error?.message || err?.error?.Message || 'Unable to load documents');
      }
    });
  }

  get filteredDocuments(): any[] {
    const query = this.searchText.trim().toLowerCase();
    const selectedStatus = this.statusFilter.toLowerCase();

    return this.documents.filter((doc: any) => {
      const status = (doc.status || '').toLowerCase();
      const matchesStatus = !selectedStatus || status === selectedStatus;

      const searchable = [
        doc.documentName,
        doc.status,
        doc.vehicle?.vehicleCode,
        doc.vehicle?.vehicleModel,
        doc.vehicle?.modeOfTransport,
        doc.vehicle?.travelCompany?.companyName,
        doc.adminRemarks
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }

  get pendingCount(): number {
    return this.countByStatus('Pending');
  }

  get approvedCount(): number {
    return this.countByStatus('Approved');
  }

  get rejectedCount(): number {
    return this.countByStatus('Rejected');
  }

  clearFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
  }

  openDocument(doc: any): void {
    const url = this.buildDocumentUrl(doc);

    if (!url) {
      this.toastr.warning('Document file is not available');
      return;
    }

    window.open(url, '_blank');
  }

  download(doc: any): void {
    const url = this.buildDocumentUrl(doc);

    if (!url) {
      this.toastr.warning('Document file is not available');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.documentName || 'vehicle-document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  backtohome(): void {
    this.router.navigate(['/admincontrols']);
  }

  trackByDocumentId(_: number, doc: any): number {
    return doc.documentId;
  }

  private countByStatus(status: string): number {
    return this.documents.filter(
      (doc: any) => (doc.status || '').toLowerCase() === status.toLowerCase()
    ).length;
  }

  private buildDocumentUrl(doc: any): string {
    if (!doc?.documentUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(doc.documentUrl)) {
      return doc.documentUrl;
    }

    return `${this.backendUrl}${doc.documentUrl}`;
  }
}
