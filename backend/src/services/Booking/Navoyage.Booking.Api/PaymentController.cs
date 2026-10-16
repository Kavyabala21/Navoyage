using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/payment")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IUnitOfWork _unitOfWork;
    private readonly BookingService _bookingService;

    public PaymentController(IConfiguration config, IUnitOfWork unitOfWork, BookingService bookingService)
    {
        _config = config;
        _unitOfWork = unitOfWork;
        _bookingService = bookingService;
    }

    [HttpPost("create-order")]
    public IActionResult CreateOrder([FromBody] PaymentRequest req)
    {
        var keyId = _config["Razorpay:Key"];
        var secret = _config["Razorpay:Secret"];

        if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(secret))
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { status = false, message = "Payments are not configured. Contact support." });

        var client = new Razorpay.Api.RazorpayClient(
            keyId,
            secret);

        var options = new Dictionary<string, object>
        {
            { "amount", (int)(req.Amount * 100) } ,
            { "currency", "INR" },
            { "receipt", Guid.NewGuid().ToString() }
        };

        var order = client.Order.Create(options);

        return Ok(new
        {
            keyId,
            orderId = order["id"].ToString(),
            amount = order["amount"]
        });
    }
    [HttpPost("verify-payment")]
    public IActionResult VerifyPayment([FromBody] PaymentVerifyRequest model)
    {
        var secret = _config["Razorpay:Secret"];

        if (string.IsNullOrWhiteSpace(_config["Razorpay:Key"]) || string.IsNullOrWhiteSpace(secret))
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { status = false, message = "Payments are not configured. Contact support." });

        string payload = model.razorpay_order_id + "|" + model.razorpay_payment_id;

        using var hmac = new System.Security.Cryptography.HMACSHA256(
            System.Text.Encoding.UTF8.GetBytes(secret!));

        var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(payload));
        var generatedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

        if (generatedSignature != model.razorpay_signature)
            return BadRequest("Invalid Payment");

        var client = new Razorpay.Api.RazorpayClient(
            _config["Razorpay:Key"],
            _config["Razorpay:Secret"]);

        var payment = client.Payment.Fetch(model.razorpay_payment_id);

        var status = payment["status"]?.ToString();

        if (status == "authorized")
        {
            payment.Capture(new Dictionary<string, object>
        {
            { "amount", payment["amount"] }
        });
        }

        return Ok(new { status = true });
    }

    [HttpPost("cancel-booking/{bookingId}")]
    [Authorize(Roles = "Customer")]
    public async Task<GenericResponse> CancelBooking(int bookingId)
    {
        try
        {
            var userClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userClaim == null)
             throw new UnauthorizedActionException("Invalid user token");

            int userId = int.Parse(userClaim.Value);

            await _bookingService.CancelBooking(bookingId, userId, false);

            return new GenericResponse
            {
                status = true,
                Message = _config["Bookings:CancelledTitle"]
            };
        }
        catch (UnauthorizedActionException ex)
        {
            return GenericResponse.Fail(ex);

        }
        catch (InvalidOperationAppException ex)
        {
            return GenericResponse.Fail(ex);

        }
        catch (NotFoundException ex)
        {
            return GenericResponse.Fail(ex);
        }
    }
}
