namespace CoreModels.Entities
{
    public class VehicleResponse
    {
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; } = null!;
        public int TravelCompanyId { get; set; }
        public string ModeOfTransport { get; set; } = null!;
        public string? VehicleModel { get; set; }
        public int Capacity { get; set; }
        public string? VehicleImageUrl { get; set; }
        public string VehicleCondition { get; set; } = null!;
        public bool ConditionVerified { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int ModifiedBy { get; set; }
        public string? Description { get; set; }
        public TravelCompanyResponse? TravelCompany { get; set; }
    }
}
