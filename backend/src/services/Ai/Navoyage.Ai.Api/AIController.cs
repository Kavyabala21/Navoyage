using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace PresentationLayer.Controllers
{
    /// <summary>
    /// Handles AI-based travel plan requests.
    /// Provides endpoints for:
    /// - Standard API response
    /// - Streaming response using Server-Sent Events (SSE)
    /// </summary>
    [ApiController]
    [Route("api/ai-trip")]
    public class AIController : ControllerBase
    {
        private readonly AiService _service;

        /// <summary>
        /// Constructor for dependency injection.
        /// Initializes AI service.
        /// </summary>
        public AIController(AiService service)
        {
            _service = service;
        }

        /// <summary>
        /// Generates a travel plan (standard API response).
        /// 
        /// Steps:
        /// 1. Accept request body.
        /// 2. Call AI service.
        /// 3. Return full response as JSON.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Generate(AIRequest req)
        {
            var result = await _service.GenerateTrip(req);
            return Ok(result);
        }

        /// <summary>
        /// Streams travel plan using Server-Sent Events (SSE).
        /// 
        /// Steps:
        /// 1. Set response content type to text/event-stream.
        /// 2. Build request object from query parameters.
        /// 3. Send initial progress message.
        /// 4. Generate travel plan using AI service.
        /// 5. Stream response line-by-line with delay.
        /// 6. Send completion message.
        /// </summary>
        [HttpGet("stream")]
        public async Task Stream(string destination, int days)
        {
            Response.Headers["Content-Type"] = "text/event-stream";

            var req = new AIRequest
            {
                Destination = destination,
                Days = days
            };

            await SendEvent("Generating your travel plan...");

            var result = await _service.GenerateTrip(req);

            var lines = result.PlanText!.Split('\n');

            foreach (var line in lines)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    await SendEvent(line.Trim());

                    // Small delay to simulate streaming effect
                    await Task.Delay(50);
                }
            }

            await SendEvent("Plan ready!");
        }

        /// <summary>
        /// Sends a single Server-Sent Event (SSE) message.
        /// 
        /// Format:
        /// data: message\n\n
        /// 
        /// Steps:
        /// 1. Format message according to SSE protocol.
        /// 2. Convert to byte array.
        /// 3. Write to response stream.
        /// 4. Flush response to client.
        /// </summary>
        private async Task SendEvent(string message)
        {
            var data = $"data: {message}\n\n";
            var bytes = Encoding.UTF8.GetBytes(data);

            await Response.Body.WriteAsync(bytes, 0, bytes.Length);
            await Response.Body.FlushAsync();
        }

     
    }
}
