using ApplicationLayer.Interfaces;

public class DistanceService : IDistanceRepository
{
    private readonly IUnitOfWork _unitOfWork;

    public DistanceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public double GetDistance(int sourceStopId, int destinationStopId)
    {
        var source = _unitOfWork.StopRepo.GetStopById(sourceStopId);
        var destination = _unitOfWork.StopRepo.GetStopById(destinationStopId);

        if (source == null || destination == null)
            throw new Exception("Invalid stops selected");

        return GeoDistanceCalculator.Calculate(
            source.Latitude,
            source.Longitude,
            destination.Latitude,
            destination.Longitude
        );
    }
}