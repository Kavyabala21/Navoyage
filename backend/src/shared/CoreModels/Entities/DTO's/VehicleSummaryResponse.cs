namespace CoreModels.Entities
{
    public class VehicleSummaryResponse
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
        public TravelCompanyResponse? TravelCompany { get; set; }
    }
}
