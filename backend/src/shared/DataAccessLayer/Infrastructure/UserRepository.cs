using ApplicationLayer.Interfaces;
using CoreModels.Entities;
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // Get all users
    public List<User> GetAllUsers()
    {
        return _context.User.ToList();
    }

    // Get user by ID
    public User? GetUserById(int id)
    {
        return _context.User.Find(id);
    }
    public User? GetUserByPhoneNumber(string phonenumber)
    {
        var normalizedPhoneNumber = phonenumber.Trim();
        return _context.User.FirstOrDefault(u => u.PhoneNumber == normalizedPhoneNumber);
    }
    // Get user by name
    public User? GetUserByName(string name)
    {
        var normalizedName = name.Trim().ToLower();
        return _context.User.FirstOrDefault(u => u.FullName.ToLower() == normalizedName);
    }

    // Get user by email
    public User? GetUserByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        return _context.User.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
    }

    // Add new user
    public async Task AddUser(User user)
    {
       await _context.User.AddAsync(user);
       await _context.SaveChangesAsync();
    }

    // Update user
    public bool UpdateUser(int id, int authId, User user)
    {
        if (user.UserId == id)
        {
            user.ModifiedOn = DateTime.UtcNow;
            _context.User.Update(user);
            _context.SaveChanges();
            return true;
        }
        else
        {
            return false;
        }
    }

    // Delete user
    public void DeleteUser(int id, int authId)
    {
        var user = _context.User.Find(id);
        if (user == null)
            return;

        _context.User.Remove(user);
        _context.SaveChanges();
    }
}
