public class AIResponse
{
    public string? PlanText { get; set; }

    public List<PlaceItem>? Places { get; set; }
    public List<FoodItem>? Food { get; set; }
    public List<string>? Hotels { get; set; }

    public string? Budget { get; set; }
    public string? ReturnSuggestion { get; set; }
}

public class PlaceItem
{
    public string? Name { get; set; }
    public string? Image { get; set; }
}

public class FoodItem
{
    public string? Dish { get; set; }
    public string? Image { get; set; }
}