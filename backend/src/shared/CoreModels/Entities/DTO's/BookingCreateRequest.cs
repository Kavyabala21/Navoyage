public class BookingCreateRequest
{
    public int InstanceId { get; set; }
    public decimal TotalAmount { get; set; }
    public List<PassengerCreateRequest> Passengers { get; set; } = new();
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public string? RazorpaySignature { get; set; }
    public string? PaymentStatus { get; set; }
}
