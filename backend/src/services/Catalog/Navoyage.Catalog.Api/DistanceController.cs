using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq.Expressions;

[ApiController]
[Route("api/[controller]")]
public class DistanceController : ControllerBase
{
    private readonly IDistanceRepository _distanceRepo;
    private readonly IConfiguration _config;
    public DistanceController(IDistanceRepository distanceRepo, IConfiguration config)
    {
        _distanceRepo = distanceRepo;
        _config = config;
    }
    [HttpGet("calculate")]
    [AllowAnonymous]
    public GenericResponse Calculate(int sourceStopId, int destinationStopId)
    {
        var distance = _distanceRepo.GetDistance(sourceStopId, destinationStopId);
        return new GenericResponse
        {
            status = true,
            data = Math.Round(distance,2),
            Message ="Distance calculation successful."
        };
      
    }
}