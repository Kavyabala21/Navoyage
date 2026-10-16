public static class GeoDistanceCalculator
{
    private const double EarthRadiusKm = 6371;

    public static double Calculate(
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        lat1 = ToRadians(lat1);
        lat2 = ToRadians(lat2);

        double a =
            Math.Pow(Math.Sin(dLat / 2), 2) +
            Math.Cos(lat1) *
            Math.Cos(lat2) *
            Math.Pow(Math.Sin(dLon / 2), 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double ToRadians(double angle)
    {
        return angle * (Math.PI / 180);
    }
}