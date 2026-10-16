namespace ApplicationLayer.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(int userId, string fullName, string email, string role);
    }
}