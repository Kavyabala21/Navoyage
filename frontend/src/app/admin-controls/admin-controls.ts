import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, MatTooltip],
  templateUrl: './admin-controls.html'
})
export class AdminControls implements OnInit {

  // Stores all pending documents received from backend
  documents: any[] = [];

  // Stores documents filtered based on selected transport mode
  filteredDocuments: any[] = [];

  // Base backend URL used for document downloads
  backendUrl = environment.backendBaseUrl;

  // Master data collections
  vehicles: any[] = [];
  travelCompany: any[] = [];

  // Lookup maps for quick access in UI
  vehicleMap: { [key: number]: string } = {};
  vehicleModeMap: { [key: number]: string } = {};
  travelCompanyMap: { [key: number]: string } = {};

  // Loader indicator
  loading = false;

  // Holds currently selected document for review
  selectedDoc: any = null;

  // Admin input fields during review
  remarks = '';
  vehicleCondition = '';

  // Transport mode stored in session storage
  modeofTransport = sessionStorage.getItem('transportMode');

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) {}

  // Trigger initial data loading
  ngOnInit(): void {
    this.loadVehicles();
  }

  // Fetch all vehicles and prepare mapping
  loadVehicles() {
    this.api.getAllVehicles().subscribe({
      next: (res: any) => {
        if (res.status) {

          this.vehicles = res.data;
          this.vehicleMap = {};
          this.vehicleModeMap = {};

          // Create quick lookup maps
          this.vehicles.forEach((v: any) => {
            this.vehicleMap[v.vehicleId] = v.vehicleCode;
            this.vehicleModeMap[v.vehicleId] = v.modeOfTransport;
          });

          // Load companies after vehicles
          this.loadTravelCompanies();

        } else {
          this.toastr.error('Failed to load vehicles');
        }
      },
      error: () => this.toastr.error('Error loading vehicles')
    });
  }

  // Fetch all travel companies and map owner details
  loadTravelCompanies() {
    this.api.getAllTravelCompanies().subscribe({
      next: (res: any) => {
        if (res.status) {

          this.travelCompany = res.data;
          this.travelCompanyMap = {};

          // Map ownerId to companyName
          this.travelCompany.forEach((tc: any) => {
            this.travelCompanyMap[tc.ownerId] = tc.companyName;
          });

          // Load pending documents after master data
          this.loadPendingDocuments();
        }
      },
      error: () => this.toastr.error('Error loading travel companies')
    });
  }

  // Load only pending documents and filter by transport mode
  loadPendingDocuments() {
    this.loading = true;

    this.api.getAllVehicleDocuments().subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.status) {

          // Filter documents with status 'Pending'
          this.documents = (res.data || []).filter(
            (d: any) => (d.status || '').toLowerCase() === 'pending'
          );

          // Filter based on selected transport mode
          this.filteredDocuments = this.modeofTransport
            ? this.documents.filter((d: any) =>
                (d.vehicle?.modeOfTransport || this.vehicleModeMap[d.vehicleId]) === this.modeofTransport
              )
            : this.documents;

        } else {
          this.toastr.error('Failed to load documents');
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error loading documents');
      }
    });
  }

  // Download selected document
  download(doc: any): void {

    if (!doc.documentUrl) {
      console.error('File path not found');
      return;
    }

    // Build complete file URL
    const fullUrl = this.backendUrl + doc.documentUrl;

    // Create temporary anchor to trigger download
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = doc.documentName || 'document.pdf';
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Open review panel and reset inputs
  openReview(doc: any) {
    sessionStorage.setItem('reviewDocumentId', doc.documentId);
    this.selectedDoc = doc;
    this.vehicleCondition = '';
    this.remarks = '';
  }

  // Approve document
  approve() {
    this.submitDecision('Approved');
  }

  // Reject document
  reject() {
    this.submitDecision('Rejected');
  }

  // Submit approval or rejection decision
  submitDecision(status: 'Approved' | 'Rejected') {

    // Basic validation
    if (!this.selectedDoc) {
      this.toastr.warning('Please select a document');
      return;
    }

    if (!this.vehicleCondition) {
      this.toastr.warning('Vehicle condition is required');
      return;
    }

    if (status === 'Rejected' && !this.remarks.trim()) {
      this.toastr.warning('Rejection reason is required');
      return;
    }

    this.api.approveOrRejectDocument(
      this.selectedDoc.documentId,
      status,
      this.vehicleCondition,
      this.remarks.trim()
    ).subscribe({
      next: (res: any) => {
        if (res.status) {

          this.toastr.success(
            res.message ||
            res.Message ||
            `Document ${status.toLowerCase()} successfully`
          );

          // Reset after successful action
          this.selectedDoc = null;
          this.vehicleCondition = '';
          this.remarks = '';

          // Reload updated list
          this.loadPendingDocuments();

        } else {
          this.toastr.error(
            res.message ||
            res.Message ||
            'Action failed'
          );
        }
      },
      error: (err: any) => this.toastr.error(
        err?.error?.message ||
        err?.error?.Message ||
        'Action failed'
      )
    });
  }

  // Cancel review and clear temporary data
  cancelReview() {
    this.selectedDoc = null;
    this.vehicleCondition = '';
    this.remarks = '';
    sessionStorage.removeItem('reviewDocumentId');
  }

  // Navigate back to dashboard
  backtohome() {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/dashboard']);
  }

  // Navigate to all documents page
  viewAllDocuments() {
    this.router.navigate(['viewalldocuments']);
  }

  // Enable approve button only for valid conditions
  canApprove(): boolean {
    return (
      (this.vehicleCondition === 'Good' ||
       this.vehicleCondition === 'Moderate')
    );
  }

  // Enable reject button only for valid conditions
  canReject(): boolean {
    return (
      (this.vehicleCondition === 'Moderate' ||
       this.vehicleCondition === 'Bad') &&
      !!this.remarks.trim()
    );
  }
}
