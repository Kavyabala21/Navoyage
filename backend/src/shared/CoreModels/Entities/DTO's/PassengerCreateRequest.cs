using System.ComponentModel.DataAnnotations;
public class PassengerCreateRequest
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Email { get; set; }

    [RegularExpression(@"^[0-9+]{7,19}$")]
    public string? PhoneNumber { get; set; }
    public string? SeatNumber { get; set; }
    public string UniqueIdentityNumber { get; set; } = null!;
    public int Fare { get; set; } = 0;
}
