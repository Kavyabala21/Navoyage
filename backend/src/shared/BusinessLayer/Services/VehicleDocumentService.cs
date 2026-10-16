using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles vehicle document management including
    /// upload, update, retrieval, approval, and rejection.
    /// Ensures validation, file handling, and notification processing.
    /// </summary>
    public class VehicleDocumentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public VehicleDocumentService(
            IUnitOfWork uow,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = uow;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- GET DOCUMENTS ----------------

        /// <summary>
        /// Retrieves all vehicle documents.
        /// </summary>
        public List<VehicleDocument> GetAllDocuments()
        {
            return _unitOfWork.VehicleDocumentRepo.GetAllDocuments() ?? new List<VehicleDocument>();
        }

        public List<VehicleDocumentResponse> GetAllDocumentResponses()
        {
            return GetAllDocuments()
                .Select(MapDocument)
                .ToList();
        }

        /// <summary>
        /// Retrieves documents for a specific vehicle.
        /// </summary>
        public List<VehicleDocument> GetDocumentsByVehicle(int vehicleId)
        {
            if (vehicleId <= 0)
                throw new ValidationAppException(_config["VehicleDocument:InvalidVehicleId"]!);

            return _unitOfWork.VehicleDocumentRepo.GetDocumentsByVehicleId(vehicleId) ?? new List<VehicleDocument>();
        }

        public List<VehicleDocumentResponse> GetDocumentResponsesByVehicle(int vehicleId)
        {
            return GetDocumentsByVehicle(vehicleId)
                .Select(MapDocument)
                .ToList();
        }

        /// <summary>
        /// Retrieves a specific document by its ID.
        /// </summary>
        public VehicleDocument GetDocumentById(int id)
        {
            if (id <= 0)
                throw new ValidationAppException(_config["VehicleDocument:InvalidDocumentId"]!);

            return _unitOfWork.VehicleDocumentRepo.GetDocumentById(id)
                   ?? throw new NotFoundException(_config["VehicleDocument:NotFound"]!);
        }

        public VehicleDocumentResponse GetDocumentResponseById(int id)
        {
            return MapDocument(GetDocumentById(id));
        }

        public VehicleDocumentResponse ToResponse(VehicleDocument document)
        {
            return MapDocument(document);
        }

        // ---------------- UPLOAD DOCUMENT ----------------

        /// <summary>
        /// Uploads a new document for a vehicle.
        /// Validates file type, vehicle existence,
        /// saves file to disk, and stores metadata in database.
        /// Sets document status to Pending.
        /// </summary>
        public async Task<VehicleDocument> UploadDocument(
            int vehicleId,
            string documentName,
            IFormFile file,
            int uploadedBy)
        {
            // Validate inputs
            if (vehicleId <= 0)
                throw new ValidationAppException(_config["VehicleDocument:InvalidVehicleId"]!);

            if (file == null || file.Length == 0)
                throw new ValidationAppException(_config["VehicleDocument:FileRequired"]!);

            if (string.IsNullOrWhiteSpace(documentName))
                throw new ValidationAppException(_config["VehicleDocument:NameRequired"]!);

            // Validate file extension
            var allowedExtensions = new[] { ".pdf", ".zip" };
            var ext = Path.GetExtension(file.FileName)?.ToLower();

            if (string.IsNullOrWhiteSpace(ext) || !allowedExtensions.Contains(ext))
                throw new ValidationAppException(_config["VehicleDocument:InvalidFileType"]!);

            // Ensure vehicle exists
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new NotFoundException(_config["VehicleDocument:VehicleNotFound"]!);

            // Create directory if not exists
            string folderPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Documents",
                "VehicleDocuments",
                $"Vehicle_{vehicleId}"
            );

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            // Generate unique file name
            string fileName = $"{Guid.NewGuid()}{ext}";
            string fullPath = Path.Combine(folderPath, fileName);

            // Save file to disk
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create document entity
            var document = new VehicleDocument
            {
                VehicleId = vehicleId,
                DocumentName = documentName.Trim(),
                DocumentUrl = $"/Documents/VehicleDocuments/Vehicle_{vehicleId}/{fileName}",
                UploadedBy = uploadedBy,
                UploadedOn = DateTime.UtcNow.AddHours(5.5),
                Status = "Pending"
            };

            await _unitOfWork.VehicleDocumentRepo.AddDocument(document);
            _unitOfWork.Save();
            document.Vehicle = vehicle;

            // Notify uploader
            string title = _config["VehicleDocument:UploadedTitle"]!;
            string message = _config["VehicleDocument:UploadedMessage"]!
                                .Replace("{NAME}", document.DocumentName);

            await _notificationManager.NotifyAsync(uploadedBy, title, message);

            return document;
        }

        // ---------------- UPDATE DOCUMENT ----------------

        /// <summary>
        /// Updates an existing vehicle document.
        /// Prevents modification if already approved.
        /// Resets status to Pending after update.
        /// </summary>
        public async Task UpdateDocument(
            int documentId,
            VehicleDocumentUpdateRequest request,
            int modifiedBy)
        {
            var document = _unitOfWork.VehicleDocumentRepo.GetDocumentById(documentId)
                ?? throw new NotFoundException(_config["VehicleDocument:NotFound"]!);

            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(document.VehicleId)
                ?? throw new NotFoundException(_config["VehicleDocument:VehicleNotFound"]!);

            if (document.Status == "Approved")
                throw new InvalidOperationAppException(
                    _config["VehicleDocument:CannotModifyApproved"]!);

            // Update name if provided
            if (!string.IsNullOrWhiteSpace(request.DocumentName))
                document.DocumentName = request.DocumentName.Trim();

            // Update file if provided
            if (request.File != null && request.File.Length > 0)
            {
                var allowedExtensions = new[] { ".pdf", ".zip" };
                var ext = Path.GetExtension(request.File.FileName)?.ToLower();

                if (string.IsNullOrWhiteSpace(ext) || !allowedExtensions.Contains(ext))
                    throw new ValidationAppException(
                        _config["VehicleDocument:InvalidFileType"]!);

                string folderPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "Documents",
                    "VehicleDocuments",
                    $"Vehicle_{document.VehicleId}"
                );

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                string fileName = $"{Guid.NewGuid()}{ext}";
                string fullPath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                document.DocumentUrl =
                    $"/Documents/VehicleDocuments/Vehicle_{document.VehicleId}/{fileName}";
            }

            // Reset review status
            document.UploadedOn = DateTime.UtcNow.AddHours(5.5);
            document.UploadedBy = modifiedBy;
            document.Status = "Pending";
            document.AdminRemarks = null;

            _unitOfWork.VehicleDocumentRepo.UpdateDocument(document);
            _unitOfWork.Save();

            // Notify user
            string title = _config["VehicleDocument:UpdatedTitle"]!;
            string message = _config["VehicleDocument:UpdatedMessage"]!
                                .Replace("{NAME}", document.DocumentName);

            await _notificationManager.NotifyAsync(modifiedBy, title, message);
        }

        // ---------------- APPROVE / REJECT DOCUMENT ----------------

        /// <summary>
        /// Approves or rejects a vehicle document.
        /// Updates vehicle activation and condition status accordingly.
        /// Sends notification to the document uploader.
        /// </summary>
        public async Task<VehicleDocumentResponse> ApproveOrRejectDocument(
            int modifiedBy,
            int documentId,
            string status,
            string vehicleCondition,
            string? remarks)
        {
            status = NormalizeStatus(status);
            vehicleCondition = NormalizeVehicleCondition(vehicleCondition);
            remarks = string.IsNullOrWhiteSpace(remarks) ? null : remarks.Trim();

            var document = _unitOfWork.VehicleDocumentRepo.GetDocumentById(documentId)
                ?? throw new NotFoundException(_config["VehicleDocument:NotFound"]!);

            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(document.VehicleId)
                ?? throw new NotFoundException(_config["VehicleDocument:VehicleNotFound"]!);

            if (string.IsNullOrWhiteSpace(status))
                throw new ValidationAppException(_config["VehicleDocument:InvalidStatus"]!);

            if (string.IsNullOrWhiteSpace(vehicleCondition))
                throw new ValidationAppException("Vehicle condition is required.");

            if (status == "Rejected" && string.IsNullOrWhiteSpace(remarks))
                throw new ValidationAppException("Rejection reason is required.");

            // Update document review status
            document.Status = status;
            document.AdminRemarks = remarks;

            // Update vehicle status based on review outcome
            vehicle.IsActive = status == "Approved";
            vehicle.VehicleCondition = vehicleCondition;
            vehicle.ConditionVerified = true;
            vehicle.ModifiedBy = modifiedBy;
            vehicle.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.VehicleDocumentRepo.UpdateDocument(document);
            _unitOfWork.VehicleRepo.UpdateVehicle(vehicle, modifiedBy);
            _unitOfWork.Save();

            // Notify uploader
            string title = status == "Approved"
                ? _config["VehicleDocument:ReviewedTitleApproved"]!
                : _config["VehicleDocument:ReviewedTitleRejected"]!;

            string message = _config["VehicleDocument:ReviewedMessage"]!
                                .Replace("{NAME}", document.DocumentName)
                                .Replace("{STATUS}", status.ToLower());

            await _notificationManager.NotifyAsync(
                document.UploadedBy,
                title,
                message
            );

            return MapDocument(document);
        }

        private static VehicleDocumentResponse MapDocument(VehicleDocument document)
        {
            return new VehicleDocumentResponse
            {
                DocumentId = document.DocumentId,
                VehicleId = document.VehicleId,
                DocumentName = document.DocumentName,
                DocumentUrl = document.DocumentUrl,
                UploadedOn = document.UploadedOn,
                UploadedBy = document.UploadedBy,
                Status = document.Status,
                AdminRemarks = document.AdminRemarks,
                Vehicle = MapVehicle(document.Vehicle)
            };
        }

        private static VehicleSummaryResponse? MapVehicle(Vehicle? vehicle)
        {
            if (vehicle is null)
                return null;

            return new VehicleSummaryResponse
            {
                VehicleId = vehicle.VehicleId,
                VehicleCode = vehicle.VehicleCode,
                TravelCompanyId = vehicle.TravelCompanyId,
                ModeOfTransport = vehicle.ModeOfTransport,
                VehicleModel = vehicle.VehicleModel,
                Capacity = vehicle.Capacity,
                VehicleImageUrl = vehicle.VehicleImageUrl,
                VehicleCondition = vehicle.VehicleCondition,
                ConditionVerified = vehicle.ConditionVerified,
                IsActive = vehicle.IsActive,
                TravelCompany = MapTravelCompany(vehicle.TravelCompany)
            };
        }

        private static TravelCompanyResponse? MapTravelCompany(TravelCompany? company)
        {
            if (company is null)
                return null;

            return new TravelCompanyResponse
            {
                TravelCompanyId = company.TravelCompanyId,
                OwnerId = company.OwnerId,
                CompanyName = company.CompanyName,
                Description = company.Description,
                IsActive = company.IsActive,
                CreatedOn = company.CreatedOn
            };
        }

        private static string NormalizeStatus(string? status)
        {
            return status?.Trim().ToLowerInvariant() switch
            {
                "approved" => "Approved",
                "rejected" => "Rejected",
                _ => string.Empty
            };
        }

        private static string NormalizeVehicleCondition(string? condition)
        {
            return condition?.Trim().ToLowerInvariant() switch
            {
                "good" => "Good",
                "moderate" => "Moderate",
                "bad" => "Bad",
                _ => string.Empty
            };
        }
    }
}
