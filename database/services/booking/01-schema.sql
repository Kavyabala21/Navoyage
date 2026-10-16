IF DB_ID(N'EndaVay_Booking') IS NULL
BEGIN
    CREATE DATABASE EndaVay_Booking;
END
GO

USE EndaVay_Booking;
GO

IF OBJECT_ID(N'dbo.tbl_Booking', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Booking (
        BookingId          INT           IDENTITY(1,1) NOT NULL,
        UserId             INT                         NOT NULL,
        InstanceId         INT                         NOT NULL,
        PNR                VARCHAR(20)                 NOT NULL,
        TotalAmount        DECIMAL(10,2)               NOT NULL,
        Status             VARCHAR(20)                 NOT NULL DEFAULT 'Confirmed',
        PaymentId          INT                         NULL,
        CreatedOn          DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        RazorpayOrderId    VARCHAR(100)                NULL,
        RazorpayPaymentId  VARCHAR(100)                NULL,
        RazorpaySignature  VARCHAR(200)                NULL,
        PaymentStatus      VARCHAR(20)                 NOT NULL DEFAULT 'Pending',

        CONSTRAINT pk_Booking               PRIMARY KEY (BookingId),
        CONSTRAINT uq_Booking_PNR           UNIQUE (PNR),
        CONSTRAINT ck_Booking_Status        CHECK (Status IN ('Confirmed','Cancelled','Completed','WaitingList')),
        CONSTRAINT ck_Booking_TotalAmount   CHECK (TotalAmount >= 0),
        CONSTRAINT ck_Booking_PaymentStatus CHECK (PaymentStatus IN ('Pending','Success','Failed','Refunded','PartiallyRefunded'))
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Passenger', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Passenger (
        PassengerId          INT           IDENTITY(1,1) NOT NULL,
        BookingId            INT                         NOT NULL,
        FirstName            VARCHAR(100)                NOT NULL,
        LastName             VARCHAR(100)                NOT NULL,
        Age                  INT                         NULL,
        Gender               VARCHAR(20)                 NULL,
        Email                VARCHAR(150)                NULL,
        PhoneNumber          VARCHAR(20)                 NULL,
        SeatNumber           VARCHAR(10)                 NULL,
        Status               VARCHAR(20)                 NOT NULL DEFAULT 'Confirmed',
        CreatedOn            DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        UniqueIdentityNumber VARCHAR(20)                 NOT NULL,
        Fare                 DECIMAL(10,2)               NOT NULL DEFAULT 0,

        CONSTRAINT pk_Passenger         PRIMARY KEY (PassengerId),
        CONSTRAINT ck_Passenger_Age     CHECK (Age IS NULL OR Age > 0),
        CONSTRAINT ck_Passenger_Email   CHECK (Email IS NULL OR Email LIKE '%_@_%.__%'),
        CONSTRAINT ck_Passenger_Phone   CHECK (PhoneNumber IS NULL OR PhoneNumber LIKE '+[0-9]%' AND LEN(PhoneNumber) BETWEEN 8 AND 20),
        CONSTRAINT ck_Passenger_Gender  CHECK (Gender IN ('Male','Female','Other') OR Gender IS NULL),
        CONSTRAINT ck_Passenger_Status  CHECK (Status IN ('Confirmed','Cancelled','WaitingList')),
        CONSTRAINT fk_Passenger_Booking FOREIGN KEY (BookingId) REFERENCES dbo.tbl_Booking(BookingId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Payment', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Payment (
        PaymentId     INT           IDENTITY(1,1) NOT NULL,
        BookingId     INT                         NOT NULL,
        Amount        DECIMAL(10,2)               NOT NULL,
        PaymentMethod VARCHAR(20)                 NOT NULL,
        PaymentStatus VARCHAR(20)                 NOT NULL,
        TransactionId VARCHAR(100)                NULL,
        CreatedOn     DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_Payment               PRIMARY KEY (PaymentId),
        CONSTRAINT uq_Payment_TransactionId UNIQUE (TransactionId),
        CONSTRAINT ck_Payment_Amount        CHECK (Amount > 0),
        CONSTRAINT ck_Payment_Method        CHECK (PaymentMethod IN ('Card','UPI','NetBanking')),
        CONSTRAINT ck_Payment_Status        CHECK (PaymentStatus IN ('Pending','Success','Failed','Refunded')),
        CONSTRAINT fk_Payment_Booking       FOREIGN KEY (BookingId) REFERENCES dbo.tbl_Booking(BookingId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Review', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Review (
        ReviewId  INT           IDENTITY(1,1) NOT NULL,
        BookingId INT                         NOT NULL,
        UserId    INT                         NOT NULL,
        Rating    INT                         NOT NULL,
        Comments  NVARCHAR(MAX)               NULL,
        CreatedOn DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_Review         PRIMARY KEY (ReviewId),
        CONSTRAINT ck_Review_Rating  CHECK (Rating BETWEEN 1 AND 5),
        CONSTRAINT fk_Review_Booking FOREIGN KEY (BookingId) REFERENCES dbo.tbl_Booking(BookingId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Coupon', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Coupon (
        CouponId      INT          IDENTITY(1,1) NOT NULL,
        Code          VARCHAR(20)                NOT NULL,
        DiscountValue DECIMAL(5,2)               NOT NULL,
        DiscountType  VARCHAR(20)                NOT NULL,
        ValidFrom     DATE                       NOT NULL,
        ValidTo       DATE                       NOT NULL,
        IsActive      BIT                        NOT NULL DEFAULT 1,
        CreatedOn     DATETIME                   NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_Coupon               PRIMARY KEY (CouponId),
        CONSTRAINT uq_Coupon_Code          UNIQUE (Code),
        CONSTRAINT ck_Coupon_DiscountValue CHECK (DiscountValue >= 0),
        CONSTRAINT ck_Coupon_Type          CHECK (DiscountType IN ('Percentage','Flat'))
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_CouponUsage', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_CouponUsage (
        CouponUsageId INT      IDENTITY(1,1) NOT NULL,
        CouponId      INT                    NOT NULL,
        UserId        INT                    NOT NULL,
        BookingId     INT                    NOT NULL,
        CreatedOn     DATETIME               NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_CouponUsage         PRIMARY KEY (CouponUsageId),
        CONSTRAINT fk_CouponUsage_Coupon  FOREIGN KEY (CouponId) REFERENCES dbo.tbl_Coupon(CouponId),
        CONSTRAINT fk_CouponUsage_Booking FOREIGN KEY (BookingId) REFERENCES dbo.tbl_Booking(BookingId)
    );
END
GO

IF OBJECT_ID(N'dbo.sp_AddBooking', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AddBooking;
GO

IF EXISTS (SELECT 1 FROM sys.types WHERE name = N'PassengerType')
    DROP TYPE dbo.PassengerType;
GO

CREATE TYPE dbo.PassengerType AS TABLE
(
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Age INT,
    Gender VARCHAR(20),
    Email VARCHAR(150),
    PhoneNumber VARCHAR(20),
    SeatNumber VARCHAR(10),
    UniqueIdentityNumber VARCHAR(20),
    Fare INT
);
GO

CREATE PROCEDURE dbo.sp_AddBooking
(
    @UserId INT,
    @InstanceId INT,
    @PNR VARCHAR(20),
    @TotalAmount DECIMAL(10,2),
    @RazorpayOrderId VARCHAR(100) = NULL,
    @RazorpayPaymentId VARCHAR(100) = NULL,
    @RazorpaySignature VARCHAR(200) = NULL,
    @PaymentStatus VARCHAR(20) = 'Success',
    @Passengers dbo.PassengerType READONLY
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @TotalAmount <= 0
            THROW 50002, 'Invalid Amount', 1;

        IF NOT EXISTS (SELECT 1 FROM @Passengers)
            THROW 50003, 'Passengers required', 1;

        IF (SELECT COUNT(*) FROM @Passengers) > 6
            THROW 50004, 'Max 6 passengers allowed', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.tbl_Passenger p
            JOIN dbo.tbl_Booking b ON p.BookingId = b.BookingId
            WHERE b.InstanceId = @InstanceId
            AND p.UniqueIdentityNumber IN (SELECT UniqueIdentityNumber FROM @Passengers)
        )
            THROW 50005, 'Duplicate passenger found', 1;

        INSERT INTO dbo.tbl_Booking
        (
            UserId,
            InstanceId,
            PNR,
            TotalAmount,
            Status,
            RazorpayOrderId,
            RazorpayPaymentId,
            RazorpaySignature,
            PaymentStatus
        )
        VALUES
        (
            @UserId,
            @InstanceId,
            @PNR,
            @TotalAmount,
            'Confirmed',
            @RazorpayOrderId,
            @RazorpayPaymentId,
            @RazorpaySignature,
            ISNULL(@PaymentStatus, 'Success')
        );

        DECLARE @BookingId INT = SCOPE_IDENTITY();

        INSERT INTO dbo.tbl_Passenger
        (
            BookingId,
            FirstName,
            LastName,
            Age,
            Gender,
            Email,
            PhoneNumber,
            SeatNumber,
            UniqueIdentityNumber,
            Fare,
            Status
        )
        SELECT
            @BookingId,
            p.FirstName,
            p.LastName,
            p.Age,
            p.Gender,
            p.Email,
            p.PhoneNumber,
            p.SeatNumber,
            p.UniqueIdentityNumber,
            p.Fare,
            'Confirmed'
        FROM @Passengers p;

        SELECT @BookingId AS BookingId, @PNR AS PNR;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
