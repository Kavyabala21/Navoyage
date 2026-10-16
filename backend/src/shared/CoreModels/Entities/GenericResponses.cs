namespace CoreModels.Entities
{
    public class GenericResponse
    {
        public bool status { get; set; }
        public object? data { get; set; }
        public string? Message { get; set; }
        public static GenericResponse Fail(Exception ex)
        {
            return new GenericResponse
            {
                status = false,
                Message = ex.Message
            };
        }
    }
}
