import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehicles.html'
})
export class Vehicles implements OnInit {

  /* ===== MODES ===== */
  isAddVehicle = false;
  isEditVehicle = false;
  isDocumentMode = false;
  showDocumentForm = false;

  vehicleId!: number;

  /* ===== VEHICLE ===== */
  vehicleCode = '';
  vehicleModel = '';
  modeOfTransport = '';
  capacity!: number;
  description = '';
  vehicleImage!: File;

  /* ===== DOCUMENT ===== */
  documentName = '';
  documentFile!: File;
  existingDocuments: any[] = [];

  /* ===== ERRORS ===== */
  vehicleCodeError = '';
  vehicleModelError = '';
  capacityError = '';
  descriptionError = '';
  vehicleImageError = '';
  documentNameError = '';
  documentFileError = '';

  loading = false;
  backendUrl = environment.backendBaseUrl;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: Api_Calls,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    this.modeOfTransport = sessionStorage.getItem('transportMode') || '';

    const qp = this.route.snapshot.queryParams;

    if (qp['mode'] === 'vehicle' && qp['id']) {
      this.isEditVehicle = true;
      this.vehicleId = +qp['id'];
      this.loadVehicle();
      return;
    }

    if (qp['mode'] === 'document' && qp['id']) {
      this.isDocumentMode = true;
      this.vehicleId = +qp['id'];
      this.loadVehicleDocuments();
      return;
    }

    this.isAddVehicle = true;
  }

  /* ================= UTIL ================= */

  private normalizeSpaces(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  get vehicleCodeExample(): string {

    switch (this.modeOfTransport.toLowerCase()) {

      case 'bus':
        return 'Example: KA01AB1234';

      case 'flight':
        return 'Example: AI202 or 6E123';

      case 'train':
        return 'Example: 12345';

      default:
        return '';
    }
  }

  /* ================= VALIDATIONS ================= */

  validateVehicleCode(): boolean {

    if (!this.vehicleCode.trim()) {
      this.vehicleCodeError = 'Vehicle code is required';
      return false;
    }

    this.vehicleCode = this.normalizeSpaces(this.vehicleCode.toUpperCase());

    let pattern: RegExp;

    switch (this.modeOfTransport.toLowerCase()) {

      case 'bus':
        pattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/;
        break;

      case 'flight':
        pattern = /^[A-Z0-9]{2}\d{1,4}$/;
        break;

      case 'train':
        pattern = /^\d{5}$/;
        break;

      default:
        this.vehicleCodeError = 'Invalid transport mode';
        return false;
    }

    if (!pattern.test(this.vehicleCode)) {
      this.vehicleCodeError = `Invalid format. ${this.vehicleCodeExample}`;
      return false;
    }

    this.vehicleCodeError = '';
    return true;
  }

  validateVehicleModel(): boolean {

    if (!this.vehicleModel.trim()) {
      this.vehicleModelError = 'Vehicle model required';
      return false;
    }

    this.vehicleModel = this.normalizeSpaces(this.vehicleModel);

    const pattern = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

    if (!pattern.test(this.vehicleModel)) {
      this.vehicleModelError = 'Only letters and numbers allowed (single space only)';
      return false;
    }

    this.vehicleModelError = '';
    return true;
  }

  validateCapacity(): boolean {

    if (!this.capacity || this.capacity <= 0) {
      this.capacityError = 'Capacity must be greater than 0';
      return false;
    }

    this.capacityError = '';
    return true;
  }

  validateDescription(): boolean {

    if (!this.description.trim()) {
      this.descriptionError = 'Description required';
      return false;
    }

    this.description = this.normalizeSpaces(this.description);
    this.descriptionError = '';
    return true;
  }

  validateDocumentName(): boolean {

    if (!this.documentName.trim()) {
      this.documentNameError = 'Document name required';
      return false;
    }

    this.documentName = this.normalizeSpaces(this.documentName);

    const pattern = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

    if (!pattern.test(this.documentName)) {
      this.documentNameError = 'Only letters and numbers allowed (single space only)';
      return false;
    }

    this.documentNameError = '';
    return true;
  }

  /* ================= FILE VALIDATION ================= */

  onVehicleImageSelect(e: any): void {

    if (e.target.files?.length) {

      const file = e.target.files[0];

      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.vehicleImageError = 'Only JPG or PNG allowed';
        return;
      }

      this.vehicleImage = file;
      this.vehicleImageError = '';
    }
  }

  onDocumentSelect(e: any): void {

    if (e.target.files?.length) {

      const file = e.target.files[0];

      if (![
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed'
      ].includes(file.type)) {
        this.documentFileError = 'Only PDF or ZIP allowed';
        return;
      }

      this.documentFile = file;
      this.documentFileError = '';
    }
  }

  /* ================= LOAD ================= */

  loadVehicle(): void {
    this.api.getVehicleById(this.vehicleId)
      .subscribe((res: any) => {
        const v = res?.data;
        if (!v) return;
        this.vehicleCode = v.vehicleCode;
        this.vehicleModel = v.vehicleModel;
        this.capacity = v.capacity;
        this.description = v.description;
      });
  }

  loadVehicleDocuments(): void {
    this.api.getDocumentsByVehicle(this.vehicleId)
      .subscribe((res: any) => {
        this.existingDocuments = res?.data || [];
      });
  }

  /* ================= ADD VEHICLE ================= */

  addVehicle(): void {

    if (
      !this.validateVehicleCode() ||
      !this.validateVehicleModel() ||
      !this.validateCapacity() ||
      !this.validateDescription() ||
      !this.vehicleImage
    ) {
      this.toastr.warning('Please fix form errors');
      return;
    }

    this.loading = true;

    this.api.getMyTravelCompany()
      .subscribe({

        next: (res: any) => {

          if (!res || !res.data || !res.data.travelCompanyId) {

            this.loading = false;
            this.toastr.error(
              res?.message ||
              res?.Message ||
              'Company setup could not be completed. Please try again.'
            );
            return;

          }

          const travelCompanyId = res.data.travelCompanyId;

          const fd = new FormData();
          fd.append('VehicleCode', this.vehicleCode);
          fd.append('TravelCompanyId', travelCompanyId.toString());
          fd.append('ModeOfTransport', this.modeOfTransport);
          fd.append('VehicleModel', this.vehicleModel);
          fd.append('Capacity', this.capacity.toString());
          fd.append('Description', this.description);
          fd.append('VehicleImage', this.vehicleImage);

          this.api.addVehicle(fd).subscribe({

            next: (response: any) => {

              this.loading = false;

              if (response?.status === false) {
                this.toastr.error(
                  response?.message ||
                  response?.Message ||
                  'Failed to add vehicle'
                );
                return;
              }

              const vehicleId = response?.data?.vehicleId;

              if (!vehicleId) {
                this.toastr.error('Vehicle was not created. Please try again.');
                return;
              }

              this.vehicleId = vehicleId;

              this.isAddVehicle = false;
              this.showDocumentForm = true;

              this.toastr.success('Vehicle added successfully');

            },

            error: err => {

              this.loading = false;
              this.toastr.error(
                err?.error?.message ||
                err?.error?.Message ||
                'Failed to add vehicle'
              );

            }

          });

        },

        error: err => {

          this.loading = false;
          this.toastr.error(
            err?.error?.message ||
            err?.error?.Message ||
            'Failed to fetch travel company'
          );

        }

      });

  }

  /* ================= UPDATE VEHICLE ================= */

  updateVehicle(): void {

    if (!this.validateCapacity() || !this.validateDescription()) {
      return;
    }

    const fd = new FormData();
    fd.append('Capacity', this.capacity.toString());
    fd.append('Description', this.description);

    if (this.vehicleImage) {
      fd.append('VehicleImage', this.vehicleImage);
    }

    this.api.updateVehicle(this.vehicleId, fd)
      .subscribe(() => {
        this.toastr.success('Vehicle updated');
        this.router.navigate(['/allvehicles']);
      });
  }

  /* ================= UPLOAD DOCUMENT ================= */

  uploadDocument(): void {

    if (!this.validateDocumentName() || !this.documentFile) {
      return;
    }

    const fd = new FormData();
    fd.append('VehicleId', this.vehicleId.toString());
    fd.append('DocumentName', this.documentName);
    fd.append('File', this.documentFile);

    this.api.uploadVehicleDocument(fd)
      .subscribe(() => {
        this.toastr.success('Document uploaded');
        this.documentName = '';
        this.documentFile = undefined as any;
        this.loadVehicleDocuments();
      });
    this.router.navigate(['/allvehicles']);
  }

  /* ================= VIEW DOCUMENT ================= */

  viewDocument(doc: any): void {

    if (!doc.documentUrl) return;

    const fullUrl = this.backendUrl + doc.documentUrl;
    window.open(fullUrl, '_blank');
  }

  /* ================= DOWNLOAD DOCUMENT ================= */

  downloadDocument(doc: any): void {

    if (!doc.documentUrl) return;

    const fullUrl = this.backendUrl + doc.documentUrl;

    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = doc.documentName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  gotohome(): void {
    this.router.navigate(['/allvehicles']);
  }
}
