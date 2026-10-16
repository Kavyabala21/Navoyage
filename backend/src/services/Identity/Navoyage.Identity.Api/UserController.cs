using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using BusinessLayer.Services;
using CoreModels.Entities;
using Navoyage.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ITokenService _tokenService;
        private readonly ILogger<UserController> _logger;
        private readonly IConfiguration _config;
        public UserController(
            UserService userService,
            ITokenService tokenService,
            ILogger<UserController> logger,IConfiguration config)
        {
            _userService = userService;
            _tokenService = tokenService;
            _logger = logger;
            _config = config;
        }


        // ---------------------------------------------------------
        // LOGIN
        // ---------------------------------------------------------
        [HttpPost("Login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] User.LoginModel model)
        {
            try
            {
                var user = _userService.ValidateLogin(
                    model.UserName,
                    model.Password,
                    model.UserEmail ?? model.Email,
                    model.PhoneNumber,
                    model.LoginIdentifier
                );

                var token = _tokenService.GenerateToken(
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Role
                );

                return Ok(new GenericResponse
                {
                    status = true,
                    Message = _config["User:LoginSuccess"],
                    data = new
                    {
                        token,
                        id = user.UserId,
                        name = user.FullName,
                        email = user.Email,
                        role = user.Role,
                        phoneNumber = user.PhoneNumber
                    }
                });
            }
            catch (ValidationAppException ex)
            {
                return BadRequest(new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                });
            }
            catch (UnauthorizedActionException ex)
            {
                return Unauthorized(new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                });
            }
        }

        // ---------------------------------------------------------
        // GET ALL USERS (ADMIN)
        // ---------------------------------------------------------

        [HttpGet("GetAllUsers")]
        [Authorize(Roles = "Admin")]
        public GenericResponse GetAllUsers()
        {
            return new GenericResponse
            {
                status = true,
                data = _userService.GetAllUsers()
                    .Select(ToUserResponse)
                    .ToList(),
                Message = _config["User:UsersRetrieved"]
            };
        }

        // ---------------------------------------------------------
        // GET USER BY ID
        // ---------------------------------------------------------

        [HttpGet("GetUserById/{id}")]
        [Authorize]
        public GenericResponse GetUserById(int id)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = ToUserResponse(_userService.GetUserById(id)),
                    Message = _config["User:UserRetrieved"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ---------------------------------------------------------
        // GET MY PROFILE
        // ---------------------------------------------------------

        [HttpGet("GetMyProfile")]
        [Authorize]
        public GenericResponse GetMyProfile()
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var userId))
                {
                    return new GenericResponse
                    {
                        status = false,
                        Message = "Invalid or missing authenticated user id."
                    };
                }

                return new GenericResponse
                {
                    status = true,
                    data = ToUserResponse(_userService.GetUserById(userId)),
                    Message = _config["User:ProfileRetrieved"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ---------------------------------------------------------
        // ADD USER
        // ---------------------------------------------------------

        [HttpPost("AddUser")]
        [AllowAnonymous]
        public async Task<GenericResponse> AddUser([FromBody] User user)
        {
            try
            {
                await _userService.AddUser(user);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["User:UserAdded"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ---------------------------------------------------------
        // UPDATE USER
        // ---------------------------------------------------------

        [HttpPut("UpdateUser/{id}")]
        [Authorize]
        public async Task<GenericResponse> UpdateUser(
            int id,
            [FromBody] User updateModel)
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var authId))
                {
                    return new GenericResponse
                    {
                        status = false,
                        Message = "Invalid or missing authenticated user id."
                    };
                }

                await _userService.UpdateUser(id, authId, updateModel);

                var updatedUser = _userService.GetUserById(id)!;

                var token = _tokenService.GenerateToken(
                    updatedUser.UserId,
                    updatedUser.FullName,
                    updatedUser.Email,
                    updatedUser.Role
                );

                return new GenericResponse
                {
                    status = true,
                    Message = _config["User:UserUpdated"],
                    data = new
                    {
                        token,
                        updatedUser = ToUserResponse(updatedUser)
                    }
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ---------------------------------------------------------
        // DELETE USER (SOFT DELETE)
        // ---------------------------------------------------------

        [HttpPut("DeleteUser/{id}")]
        [Authorize]
        public async Task<GenericResponse> DeleteUser(int id)
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var authId))
                {
                    return new GenericResponse
                    {
                        status = false,
                        Message = "Invalid or missing authenticated user id."
                    };
                }

                await _userService.DeleteUser(id, authId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["User:UserStatusUpdated"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        private bool TryGetAuthenticatedUserId(out int userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("nameid")
                ?? User.FindFirstValue("sub");

            return int.TryParse(value, out userId);
        }

        private static object? ToUserResponse(User? user)
        {
            if (user is null)
            {
                return null;
            }

            return new
            {
                id = user.UserId,
                userId = user.UserId,
                name = user.FullName,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                role = user.Role,
                isActive = user.IsActive,
                createdOn = user.CreatedOn,
                modifiedOn = user.ModifiedOn,
                modifiedBy = user.ModifiedBy
            };
        }
    }
}
