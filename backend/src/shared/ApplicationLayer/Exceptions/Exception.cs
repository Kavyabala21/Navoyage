namespace ApplicationLayer.Exceptions
{
    public class Exception : System.Exception
    {
        public Exception(string message) : base(message) { }
    }
    public class UnauthorizedActionException : System.Exception
    {        public UnauthorizedActionException(string message) : base(message) { } 
    }
    public class ValidationAppException : System.Exception
    {
        public ValidationAppException(string message) : base(message) { }
    }
    public class InvalidOperationAppException : System.Exception {
        public InvalidOperationAppException(string message) : base(message) { }
    }
    public class NotFoundException : System.Exception {
        public NotFoundException(string message) : base(message) { }
    }
    public class  AlreadyExistsException: System.Exception{
        public AlreadyExistsException(string message) : base(message) { }
    }
}
