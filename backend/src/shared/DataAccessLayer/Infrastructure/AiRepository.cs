using ApplicationLayer.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

public class AiRepository : IAiRepository
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public AiRepository(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> GenerateExplanation(string prompt)
    {
        var apiKey = _config["Gemini:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new Exception("Gemini API Key is missing.");

        var model = _config["Gemini:Model"];

        if (string.IsNullOrWhiteSpace(model))
            model = "gemini-2.5-flash";

        var baseUrl = _config["Gemini:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
            baseUrl = "https://generativelanguage.googleapis.com";

        var endpoint =
            $"{baseUrl}/v1beta/models/{model}:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new
                        {
                            text =
$@"You are an expert travel planner.

Return ONLY valid JSON.

Do not return markdown.
Do not return ```json.

User Request:
{prompt}"
                        }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.4
            }
        };

        var json = JsonSerializer.Serialize(requestBody);

        var content = new StringContent(
            json,
            Encoding.UTF8,
            "application/json");

        var response = await _http.PostAsync(endpoint, content);

        var responseText = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Gemini Error : {response.StatusCode}\n{responseText}");

        using var document = JsonDocument.Parse(responseText);

        var generatedText = document.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(generatedText))
            throw new Exception("Gemini returned an empty response.");

        generatedText = generatedText
            .Replace("```json", "")
            .Replace("```", "")
            .Trim();

        return generatedText;
    }

    public async Task<string> GetRealImage(string query)
    {
        var key = _config["Unsplash:AccessKey"];

        if (string.IsNullOrWhiteSpace(key))
            return "";

        var url =
     $"https://api.unsplash.com/search/photos?query={Uri.EscapeDataString(query)}&per_page=1&orientation=landscape&content_filter=high&client_id={key}";
        var response = await _http.GetAsync(url);

        if (!response.IsSuccessStatusCode)
            return "";

        var json = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(json);

        var results = document.RootElement.GetProperty("results");

        if (results.GetArrayLength() == 0)
            return "";

        return results[0]
            .GetProperty("urls")
            .GetProperty("regular")
            .GetString() ?? "";
    }
}