using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IUserRepository
    {
        List<User> GetAllUsers();
        User? GetUserById(int id);
        User? GetUserByPhoneNumber(string PhoneNumber);
        User? GetUserByName(string name);
        User? GetUserByEmail(string email);
        Task AddUser(User user);
        bool UpdateUser(int id,int authId,User user);
        void DeleteUser(int id, int authId);
    }
}
