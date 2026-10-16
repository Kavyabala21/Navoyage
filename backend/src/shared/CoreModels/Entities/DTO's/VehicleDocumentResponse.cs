namespace CoreModels.Entities
{
    public class VehicleDocumentResponse
    {
        public int DocumentId { get; set; }
        public int VehicleId { get; set; }
        public string DocumentName { get; set; } = null!;
        public string DocumentUrl { get; set; } = null!;
        public DateTime UploadedOn { get; set; }
        public int UploadedBy { get; set; }
        public string Status { get; set; } = null!;
        public string? AdminRemarks { get; set; }
        public VehicleSummaryResponse? Vehicle { get; set; }
    }
}
