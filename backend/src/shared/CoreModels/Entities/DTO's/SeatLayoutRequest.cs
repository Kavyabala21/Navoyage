public class SeatLayoutSaveRequest
{
    public int VehicleId { get; set; }
    public string LayoutJSON { get; set; } = null!;
}

public class SeatPriceUpdateRequest
{
    public int VehicleId { get; set; }
    public string SeatNo { get; set; } = null!;
    public decimal NewPrice { get; set; }
}
public class SeatLayoutUpdateRequest
{
    public int VehicleId { get; set; }
    public string LayoutJSON { get; set; } = null!;
}
