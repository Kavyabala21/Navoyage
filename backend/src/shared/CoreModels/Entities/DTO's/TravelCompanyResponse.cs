namespace CoreModels.Entities
{
    public class TravelCompanyResponse
    {
        public int TravelCompanyId { get; set; }
        public int OwnerId { get; set; }
        public string CompanyName { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
        public UserSummaryResponse? Owner { get; set; }
    }
}
