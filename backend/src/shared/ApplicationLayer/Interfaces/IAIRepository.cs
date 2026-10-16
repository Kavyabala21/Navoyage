namespace ApplicationLayer.Interfaces
{
    public interface IAiRepository
    {
        Task<string> GenerateExplanation(string prompt);
        Task<string> GetRealImage(string query);

    }
}