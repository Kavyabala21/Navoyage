using ApplicationLayer.Interfaces;
using System.Text.Json;
using System.Text.RegularExpressions;

public class AiService
{
    private readonly IAiRepository _repo;

    public AiService(IUnitOfWork uow)
    {
        _repo = uow.AiRepo;
    }

    public async Task<AIResponse> GenerateTrip(AIRequest req)
    {
        ValidateRequest(req);
        ValidateIntent(req);
        ValidateDestination(req.Destination!);

        var normalized = NormalizeRequest(req);

        var prompt = BuildPrompt(normalized);

        var rawJson = await _repo.GenerateExplanation(prompt);

        ValidateAIResponse(rawJson);

        return await ProcessResponse(rawJson, normalized);
    }

    // ---------------- VALIDATION ----------------

    private void ValidateRequest(AIRequest req)
    {
        if (req == null)
            throw new Exception("Request is null.");

        if (string.IsNullOrWhiteSpace(req.Destination))
            throw new Exception("Destination is required.");

        if (req.Days <= 0 || req.Days > 10)
            throw new Exception("Trip days must be between 1 and 10.");

        if (!string.IsNullOrWhiteSpace(req.Budget) && req.Budget.Length > 20)
            throw new Exception("Invalid budget.");
    }

    private AIRequest NormalizeRequest(AIRequest req)
    {
        req.Destination = req.Destination!.Trim();
        req.Budget ??= "Medium";
        req.FoodPreference ??= "None";

        return req;
    }

    // ---------------- PROMPT ----------------

    private string BuildPrompt(AIRequest req)
    {
        return $@"
You are an expert travel planner.

Generate a {req.Days}-day travel itinerary for {req.Destination}.

Return ONLY valid JSON.

Do not return markdown.
Do not return ```json.

Return exactly this JSON:

{{
  ""PLACES"": [
    ""Place 1"",
    ""Place 2""
  ],

  ""FOOD"": [
    ""Restaurant 1"",
    ""Restaurant 2""
  ],

  ""HOTELS"": [
    ""Hotel 1"",
    ""Hotel 2""
  ],

  ""BUDGET"": ""Medium"",

  ""RETURN"": ""A short travel summary""
}}

Rules:

- Real tourist attractions only.
- Real restaurants only.
- Real hotels only.
- Maximum 5 places.
- Maximum 3 restaurants.
- Maximum 3 hotels.
- Return JSON only.";
    }
    // ---------------- RESPONSE VALIDATION ----------------

    private void ValidateAIResponse(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new Exception("Empty AI response.");

        try
        {
            JsonDocument.Parse(json);
        }
        catch
        {
            throw new Exception("Gemini returned invalid JSON.");
        }
    }

    // ---------------- PROCESS RESPONSE ----------------

    private async Task<AIResponse> ProcessResponse(string json, AIRequest req)
    {
        var trip = JsonSerializer.Deserialize<GeminiTripResponse>(
            json,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        if (trip == null)
            throw new Exception("Unable to parse Gemini response.");

        var places = new List<PlaceItem>();

        foreach (var place in trip.PLACES.Take(5))
        {
            var image = await _repo.GetRealImage(
                $"{place} tourist attraction in {req.Destination}, India");

            places.Add(new PlaceItem
            {
                Name = place,
                Image = image
            });
        }

        var foods = new List<FoodItem>();

        foreach (var food in trip.FOOD.Take(3))
        {
            var image = await _repo.GetRealImage($"{food} food dish Bangalore");

            foods.Add(new FoodItem
            {
                Dish = food,
                Image = image
            });
        }

        return new AIResponse
        {
            PlanText = json,
            Places = places,
            Food = foods,
            Hotels = trip.HOTELS,
            Budget = trip.BUDGET,
            ReturnSuggestion = trip.RETURN
        };
    }

    // ---------------- OTHER VALIDATIONS ----------------

    private void ValidateDestination(string destination)
    {
        if (!Regex.IsMatch(destination, @"^[a-zA-Z\s]+$"))
            throw new Exception("Invalid destination.");

        if (destination.Length < 3)
            throw new Exception("Destination too short.");
    }

    private void ValidateIntent(AIRequest req)
    {
        var input = req.Destination!.ToLower();

        var invalid = new[]
        {
            "who is",
            "what is",
            "when is",
            "where is",
            "why is",
            "how to",
            "prime minister",
            "president",
            "capital of",
            "history of"
        };

        if (invalid.Any(x => input.Contains(x)))
            throw new Exception("Please enter a travel destination.");
    }
}