public class GeminiTripResponse
{
    public List<string> PLACES { get; set; } = new();

    public List<string> FOOD { get; set; } = new();

    public List<string> HOTELS { get; set; } = new();

    public string? BUDGET { get; set; }

    public string? RETURN { get; set; }
}