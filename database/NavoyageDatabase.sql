-- DATABASE CREATION

IF DB_ID(N'EndaVay') IS NULL
BEGIN
    CREATE DATABASE EndaVay;
END
GO

USE EndaVay;
GO



-- TABLE: tbl_User
-- Purpose: Stores all system users (Admin, TravelCompanyOwner, Customer)


CREATE TABLE      tbl_User (
    UserId        INT            IDENTITY(1,1)              NOT NULL,
    FullName      VARCHAR(150)                              NOT NULL,
    Email         VARCHAR(150)                              NOT NULL,
    PhoneNumber   VARCHAR(20)                               NOT NULL,
    Password      VARCHAR(200)                              NOT NULL,
    Role          VARCHAR(20)                               NOT NULL,
    IsActive      BIT                                       NOT NULL  DEFAULT 1,
    CreatedOn     DATETIME                                  NOT NULL  DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedOn    DATETIME                                  NULL,
    ModifiedBy    INT                                       NULL,

    CONSTRAINT    pk_User                                   PRIMARY KEY (UserId),
    CONSTRAINT    uk_User_UserName                          UNIQUE      (FullName),
    CONSTRAINT    uq_User_Email                             UNIQUE      (Email),
    CONSTRAINT    uq_User_Phone                             UNIQUE      (PhoneNumber),
    CONSTRAINT    ck_User_Email                             CHECK       (Email LIKE '%_@_%.__%'),
    CONSTRAINT    ck_User_Phone                             CHECK       (PhoneNumber LIKE '+[0-9]%' AND LEN(PhoneNumber) BETWEEN 8 AND 20),
    CONSTRAINT    ck_User_Role                              CHECK       (Role IN ('Admin','TravelCompanyOwner','Customer'))
);

-- TABLE: tbl_TravelCompanie
-- Purpose: Stores travel companies created by owners


CREATE TABLE        tbl_TravelCompany (
    TravelCompanyId INT           IDENTITY(1,1)        NOT NULL,
    OwnerId         INT                                NOT NULL,
    CompanyName     VARCHAR(150)                       NOT NULL,
    Description     NVARCHAR(MAX)                      NULL,
    IsActive        BIT                                NOT NULL DEFAULT 1,
    CreatedOn       DATETIME                           NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT      pk_TravelCompany                   PRIMARY KEY (TravelCompanyId),
    CONSTRAINT      uq_TravelCompany_Name              UNIQUE      (CompanyName),
    CONSTRAINT      fk_TravelCompany_User              FOREIGN KEY (OwnerId)     REFERENCES tbl_User(UserId)
);



-- TABLE: tbl_Vehicle
-- Purpose: Stores vehicles belonging to travel companies


CREATE TABLE         tbl_Vehicle (
    VehicleId        INT           IDENTITY(1,1)    NOT NULL,
    VehicleCode      VARCHAR(20)                    NOT NULL,
    TravelCompanyId  INT                            NOT NULL,
    ModeOfTransport  VARCHAR(20)                    NOT NULL,
    VehicleModel     VARCHAR(100)                   NULL,
    Capacity         INT                            NOT NULL,
    VehicleImageUrl  NVARCHAR(Max)                  NULL,
    VehicleCondition VARCHAR(20)                    NOT NULL,
    Description      NVARCHAR(Max)                  NULL,
    IsActive         BIT                            NOT NULL DEFAULT 1,
    CreatedOn        DATETIME                       NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedOn       DATETIME                       NULL,
    ModifiedBy       INT                    NOT NULL,
    ConditionVerified BIT                           NOT NULL DEFAULT 0,

    CONSTRAINT       pk_Vehicle                     PRIMARY KEY (VehicleId),
    CONSTRAINT       uq_Vehicle_Code                UNIQUE      (VehicleCode),
    CONSTRAINT       ck_Vehicle_Mode                CHECK       (ModeOfTransport IN ('Bus','Train','Flight')),
    CONSTRAINT       ck_Vehicle_Capacity            CHECK       (Capacity > 0),
    CONSTRAINT       ck_Vehicle_Condition           CHECK       (VehicleCondition IN ('Good','Moderate','Bad','NeedApproval')),
    CONSTRAINT       fk_Vehicle_TravelCompany       FOREIGN KEY (TravelCompanyId)   REFERENCES tbl_TravelCompany(TravelCompanyId)
);






-- TABLE: tbl_VehicleDocument
-- Purpose: Stores vehicles belonging to travel companies

CREATE TABLE tbl_VehicleDocument (
    DocumentId       INT IDENTITY(1,1) PRIMARY KEY,
    VehicleId        INT NOT NULL,
    DocumentName     VARCHAR(200) NOT NULL,
    DocumentUrl      NVARCHAR(MAX) NOT NULL,
    UploadedOn       DATETIME NOT NULL DEFAULT DATEADD(MINUTE,330,GETUTCDATE()),
    UploadedBy       INT NOT NULL,
    Status           VARCHAR(20) NOT NULL DEFAULT 'Pending',
    AdminRemarks     NVARCHAR(MAX) NULL,

    CONSTRAINT fk_VehicleDocument_Vehicle FOREIGN KEY (VehicleId) REFERENCES tbl_Vehicle(VehicleId),
    CONSTRAINT fk_VehicleDocument_User FOREIGN KEY (UploadedBy) REFERENCES tbl_User(UserId),
    CONSTRAINT ck_VehicleDocument_Status CHECK (Status IN ('Pending','Approved','Rejected'))
);


-- TABLE: tbl_Route
-- Purpose: Stores route definitions per travel company


CREATE TABLE        tbl_Route (
    RouteId         INT       IDENTITY(1,1)      NOT NULL,
    TravelCompanyId INT                          NOT NULL,
    RouteName       VARCHAR(150)                 NOT NULL,
    IsActive        BIT                          NOT NULL DEFAULT 1,
    CreatedOn       DATETIME                     NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ParentRouteId   INT                          NULL,

    CONSTRAINT      pk_Route                     PRIMARY KEY (RouteId),
    CONSTRAINT      fk_Route_TravelCompany       FOREIGN KEY (TravelCompanyId)   REFERENCES tbl_TravelCompany(TravelCompanyId),
    CONSTRAINT      fk_Route_Parent              FOREIGN KEY (ParentRouteId) REFERENCES tbl_Route(RouteId)
);


-- TABLE: tbl_Stop
-- Purpose: Stores reusable geo-location points for pickup/drop points


CREATE TABLE     tbl_Stop (
    StopId       INT               IDENTITY(1,1)         NOT NULL,
    StopName     VARCHAR(100)                            NOT NULL,
    Latitude     DECIMAL(10,6)                           NOT NULL,
    Longitude    DECIMAL(10,6)                           NOT NULL,
    CreatedOn    DATETIME                                NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedOn   DATETIME                                NULL,                                   

    CONSTRAINT   pk_Stop                                 PRIMARY KEY (StopId),
    CONSTRAINT   uq_Stop_StopName                        UNIQUE      (StopName)
);


-- TABLE: tbl_RouteStopPoint
-- Purpose: Mapping table between routes and stops


CREATE TABLE         tbl_RouteStopPoint (
    RouteStopPointId INT           IDENTITY(1,1)         NOT NULL,
    RouteId          INT                                 NOT NULL,
    StopId           INT                                 NOT NULL,
    SequenceOrder    INT                                 NOT NULL,
    CreatedOn        DATETIME                            NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedBy       INT                                 NULL,
    ModifiedOn       DATETIME                            NULL,
    IsActive         BIT                                 DEFAULT 1,
    CreatedBy        INT,
    CONSTRAINT       pk_RouteStopPoint                  PRIMARY KEY (RouteStopPointId),
    CONSTRAINT       fk_RouteStopPoint_Route            FOREIGN KEY (RouteId)  REFERENCES tbl_Route(RouteId),
    CONSTRAINT       fk_RouteStopPoint_Stop             FOREIGN KEY (StopId)   REFERENCES tbl_Stop(StopId),
    CONSTRAINT       UQ_Route_Stop                      UNIQUE (RouteId, StopId)
    );

-- TABLE: tbl_SeatLayout
-- Purpose: Stores JSON seat layout per vehicle (rows/columns/seat types)


CREATE TABLE    tbl_SeatLayout (
    Id          INT           IDENTITY(1,1)         NOT NULL,
    VehicleId   INT                                 NOT NULL,
    LayoutJSON  NVARCHAR(MAX)                       NOT NULL,
    CreatedOn   DATETIME                            NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedOn  DATETIME                            NULL,

    CONSTRAINT  pk_SeatLayout                       PRIMARY KEY (Id),
    CONSTRAINT  fk_SeatLayout_Vehicle               FOREIGN KEY (VehicleId)    REFERENCES tbl_Vehicle(VehicleId)
);



-- TABLE: tbl_Pricing
-- Purpose: Stores seat pricing + seasonal pricing rules


CREATE TABLE       tbl_Pricing (
    PricingId      INT          IDENTITY(1,1)     NOT NULL,
    VehicleId      INT                            NOT NULL,
    SeatClass      VARCHAR(50)                    NOT NULL,
    BasePrice      DECIMAL(10,2)                  NOT NULL,
    SeasonType     VARCHAR(50)                    NULL,
    EffectiveFrom  DATE                           NOT NULL,
    EffectiveTo    DATE                           NULL,
    CreatedOn      DATETIME                       NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT     pk_Pricing                     PRIMARY KEY (PricingId),
    CONSTRAINT     ck_Pricing_BasePrice           CHECK (BasePrice > 0),
    CONSTRAINT     fk_Pricing_Vehicle             FOREIGN KEY (VehicleId)    REFERENCES tbl_Vehicle(VehicleId)
);



-- TABLE: tbl_VehicleInstance
-- Purpose: Stores daily scheduled journeys for each vehicle


CREATE TABLE        tbl_VehicleInstance(
    InstanceId      INT      IDENTITY(1,1)         NOT NULL,
    VehicleId       INT                            NOT NULL,
    RouteId         INT                            NOT NULL,
    DepartureDate   DATE                           NOT NULL,
    DepartureTime   TIME                           NOT NULL,
    ArrivalDate     DATE                           NOT NULL,
    ArrivalTime     TIME                           NOT NULL,
    TotalSeats      INT                            NOT NULL,
    AvailableSeats  INT                            NOT NULL,
    Status          VARCHAR(20)                    NOT NULL DEFAULT 'Scheduled',
    CreatedOn       DATETIME2                      NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ModifiedOn      DATETIME                       NULL,
    IsActive        BIT                            NOT NULL DEFAULT 1,
    ModifiedBy      INT                            NULL,
    CONSTRAINT      pk_VehicleInstance             PRIMARY KEY (InstanceId),
    CONSTRAINT      ck_VehicleInstance_Status      CHECK (Status IN ('Scheduled','Delayed','Cancelled','Completed')),
    CONSTRAINT      fk_VehicleInstance_Vehicle     FOREIGN KEY (VehicleId)   REFERENCES tbl_Vehicle(VehicleId),
    CONSTRAINT      fk_VehicleInstance_Route       FOREIGN KEY (RouteId)     REFERENCES tbl_Route(RouteId)
);









-- TABLE: tbl_Disruption
-- Purpose: Stores disruptions raised by drivers or company owners


CREATE TABLE         tbl_Disruption (
    DisruptionId     INT         IDENTITY(1,1)          NOT NULL,
    InstanceId       INT                                NOT NULL,
    RaisedBy         INT                                NOT NULL,
    Type             VARCHAR(20)                        NOT NULL,
    Description      NVARCHAR(Max)                      NULL,
    DisruptionStage  VARCHAR(30)                        NOT NULL DEFAULT 'Raised',
    Status           VARCHAR(20)                        NOT NULL DEFAULT 'Pending',
    CreatedOn        DATETIME                           NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    ResolvedOn       DATETIME                           NULL,

    CONSTRAINT       pk_Disruption                      PRIMARY KEY (DisruptionId),
    CONSTRAINT       ck_Disruption_Type                 CHECK       (Type IN ('Delay','Breakdown','Cancel')),
    CONSTRAINT       ck_Disruption_Stage                CHECK       (DisruptionStage IN ('Raised','InProgress','Resolved')),
    CONSTRAINT       ck_Disruption_Status               CHECK       (Status IN ('Pending','Approved','Rejected')),
    CONSTRAINT       fk_Disruption_Instance             FOREIGN KEY (InstanceId) REFERENCES tbl_VehicleInstance(InstanceId),
    CONSTRAINT       fk_Disruption_User                 FOREIGN KEY (RaisedBy)   REFERENCES tbl_User(UserId)
);



-- TABLE: tbl_Booking
-- Purpose: Stores bookings, PNRs, payment references


CREATE TABLE           tbl_Booking (
    BookingId          INT        IDENTITY(1,1)         NOT NULL,
    UserId             INT                              NOT NULL,
    InstanceId         INT                              NOT NULL,
    PNR                VARCHAR(20)                      NOT NULL,
    TotalAmount        DECIMAL(10,2)                    NOT NULL,
    Status             VARCHAR(20)                      NOT NULL DEFAULT 'Confirmed',
    PaymentId          INT                              NULL,
    CreatedOn          DATETIME                         NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    RazorpayOrderId   VARCHAR(100)                      NULL,
    RazorpayPaymentId VARCHAR(100)                      NULL,
    RazorpaySignature VARCHAR(200)                      NULL,
    PaymentStatus     VARCHAR(20)                       NOT NULL DEFAULT 'Pending',

    CONSTRAINT         pk_Booking                       PRIMARY KEY (BookingId),
    CONSTRAINT         uq_Booking_PNR                   UNIQUE      (PNR),
    CONSTRAINT         ck_Booking_Status                CHECK       (Status IN ('Confirmed','Cancelled','Completed','WaitingList')),
    CONSTRAINT         ck_Booking_TotalAmount           CHECK       (TotalAmount >= 0),
    CONSTRAINT         fk_Booking_User                  FOREIGN KEY (UserId)        REFERENCES tbl_User(UserId),
    CONSTRAINT         fk_Booking_VehicleInstance       FOREIGN KEY (InstanceId)    REFERENCES tbl_VehicleInstance(InstanceId),
    CONSTRAINT         ck_Booking_PaymentStatus         CHECK (PaymentStatus IN ('Pending','Success','Failed','Refunded','PartiallyRefunded'))
);

-- TABLE: tbl_Passenger
-- Purpose: Stores passenger details for each booking


CREATE TABLE     tbl_Passenger (
    PassengerId           INT               IDENTITY(1,1)    NOT NULL,
    BookingId    INT                                NOT NULL,
    FirstName    VARCHAR(100)                       NOT NULL,
    LastName     VARCHAR(100)                       NOT NULL,
    Age          INT                                NULL,
    Gender       VARCHAR(20)                        NULL,
    Email        VARCHAR(150)                       NULL,
    PhoneNumber        VARCHAR(20)                  NULL,
    SeatNumber   VARCHAR(10)                        NULL,
    Status       VARCHAR(20)                        NOT NULL DEFAULT 'Confirmed',
    CreatedOn    DATETIME                           NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
    UniqueIdentityNumber VARCHAR(20)                NOT NULL,
    Fare         DECIMAL(10,2)                                NOT NULL DEFAULT 0,
    CONSTRAINT   pk_Passenger                      PRIMARY KEY (PassengerId),
    CONSTRAINT   ck_Passenger_Age                  CHECK       (Age > 0),
    CONSTRAINT   ck_Passenger_Email                CHECK       (Email LIKE '%_@_%.__%'),
    CONSTRAINT   ck_Passenger_Phone                CHECK       (PhoneNumber LIKE '+[0-9]%' AND LEN(PhoneNumber) BETWEEN 8 AND 20),
    CONSTRAINT   ck_Passenger_Gender               CHECK       (Gender IN ('Male','Female','Other') OR Gender IS NULL),
    CONSTRAINT   ck_Passenger_Status               CHECK       (Status IN ('Confirmed','Cancelled','WaitingList')),
    CONSTRAINT   fk_Passenger_Booking              FOREIGN KEY (BookingId)  REFERENCES tbl_Booking(BookingId)
);


-- TABLE: tbl_Payment
-- Purpose: Stores payment transactions made for bookings

CREATE TABLE       tbl_Payment (
    PaymentId      INT            IDENTITY(1,1)      NOT NULL,
    BookingId      INT                               NOT NULL,
    Amount         DECIMAL(10,2)                     NOT NULL,
    PaymentMethod  VARCHAR(20)                       NOT NULL,
    PaymentStatus  VARCHAR(20)                       NOT NULL,
    TransactionId  VARCHAR(100)                      NULL,
    CreatedOn      DATETIME                          NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT    pk_Payment                        PRIMARY KEY (PaymentId),
    CONSTRAINT    uq_Payment_TransactionId          UNIQUE      (TransactionId),
    CONSTRAINT    ck_Payment_Amount                 CHECK       (Amount > 0),
    CONSTRAINT    ck_Payment_Method                 CHECK       (PaymentMethod IN ('Card','UPI','NetBanking')),
    CONSTRAINT    ck_Payment_Status                 CHECK       (PaymentStatus IN ('Pending','Success','Failed','Refunded')),
    CONSTRAINT    fk_Payment_Booking                FOREIGN KEY (BookingId) REFERENCES tbl_Booking(BookingId)
);


-- TABLE: tbl_Review
-- Purpose: Stores customer ratings & feedback


CREATE TABLE   tbl_Review (
    ReviewId   INT            IDENTITY(1,1)     NOT NULL,
    BookingId  INT                              NOT NULL,
    UserId     INT                              NOT NULL,
    Rating     INT                              NOT NULL,
    Comments   NVARCHAR(Max)                    NULL,
    CreatedOn  DATETIME                         NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT pk_Review                        PRIMARY KEY (ReviewId),
    CONSTRAINT ck_Review_Rating                 CHECK       (Rating BETWEEN 1 AND 5),
    CONSTRAINT fk_Review_Booking                FOREIGN KEY (BookingId)          REFERENCES tbl_Booking(BookingId),
    CONSTRAINT fk_Review_User                   FOREIGN KEY (UserId)             REFERENCES tbl_User(UserId)
);


-- TABLE: tbl_Notifications
-- Purpose: Stores system notifications for users


CREATE TABLE   tbl_Notification (
    NotificationId         INT            IDENTITY(1,1)    NOT NULL,
    UserId                 INT                             NOT NULL,
    Title                  VARCHAR(150)                    NOT NULL,
    Message                VARCHAR(500)                    NOT NULL,
    IsRead                 BIT                             NOT NULL DEFAULT 0,
    CreatedOn              DATETIME                        NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT pk_Notification                             PRIMARY KEY (NotificationId),
    CONSTRAINT fk_Notification_Users                       FOREIGN KEY (UserId) REFERENCES tbl_User(UserId)
);



-- TABLE: tbl_Coupons
-- Purpose: Stores coupon definitions


CREATE TABLE       tbl_Coupon (
    CouponId       INT        IDENTITY(1,1)    NOT NULL,
    Code           VARCHAR(20)                 NOT NULL,
    DiscountValue  DECIMAL(5,2)                NOT NULL,
    DiscountType   VARCHAR(20)                 NOT NULL,
    ValidFrom      DATE                        NOT NULL,
    ValidTo        DATE                        NOT NULL,
    IsActive       BIT                         NOT NULL DEFAULT 1,
    CreatedOn      DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT pk_Coupon                       PRIMARY KEY (CouponId),
    CONSTRAINT uq_Coupon_Code                  UNIQUE      (Code),
    CONSTRAINT ck_Coupon_DiscountValue         CHECK       (DiscountValue >= 0),
    CONSTRAINT ck_Coupon_Type                  CHECK       (DiscountType IN ('Percentage','Flat'))
);



-- TABLE: tbl_CouponUsage
-- Purpose: Logs each time a coupon is used


CREATE TABLE   tbl_CouponUsage (
    CouponUsageId         INT     IDENTITY(1,1)    NOT NULL,
    CouponId   INT                      NOT NULL,
    UserId     INT                      NOT NULL,
    BookingId  INT                      NOT NULL,
    CreatedOn  DATETIME                 NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

    CONSTRAINT pk_CouponUsage           PRIMARY KEY (CouponUsageId),
    CONSTRAINT fk_CouponUsage_Coupon    FOREIGN KEY (CouponId)      REFERENCES tbl_Coupon(CouponId),
    CONSTRAINT fk_CouponUsage_User      FOREIGN KEY (UserId)        REFERENCES tbl_User(UserId),
    CONSTRAINT fk_CouponUsage_Booking   FOREIGN KEY (BookingId)     REFERENCES tbl_Booking(BookingId)
);

-- STEP 1: Drop dependencies safely
IF OBJECT_ID('sp_AddBooking') IS NOT NULL
    DROP PROCEDURE sp_AddBooking;
GO

IF EXISTS (SELECT * FROM sys.types WHERE name = 'PassengerType')
    DROP TYPE PassengerType;
GO

-- STEP 2: Create Table Type
CREATE TYPE PassengerType AS TABLE
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


-- CREATE procedure
CREATE PROCEDURE sp_AddBooking
(
    @UserId INT,
    @InstanceId INT,
    @PNR VARCHAR(20),  -- ✅ PNR comes from C#
    @TotalAmount DECIMAL(10,2),
    @RazorpayOrderId VARCHAR(100) = NULL,
    @RazorpayPaymentId VARCHAR(100) = NULL,
    @RazorpaySignature VARCHAR(200) = NULL,
    @PaymentStatus VARCHAR(20) = 'Success',
    @Passengers PassengerType READONLY
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- =========================
        -- VALIDATIONS
        -- =========================

        IF NOT EXISTS (SELECT 1 FROM tbl_VehicleInstance WHERE InstanceId = @InstanceId)
            THROW 50001, 'Invalid Instance', 1;

        IF @TotalAmount <= 0
            THROW 50002, 'Invalid Amount', 1;

        IF NOT EXISTS (SELECT 1 FROM @Passengers)
            THROW 50003, 'Passengers required', 1;

        IF (SELECT COUNT(*) FROM @Passengers) > 6
            THROW 50004, 'Max 6 passengers allowed', 1;

        -- DUPLICATE PASSENGER CHECK
        IF EXISTS (
            SELECT 1
            FROM tbl_Passenger p
            JOIN tbl_Booking b ON p.BookingId = b.BookingId
            WHERE b.InstanceId = @InstanceId
            AND p.UniqueIdentityNumber IN (
                SELECT UniqueIdentityNumber FROM @Passengers
            )
        )
        THROW 50005, 'Duplicate passenger found', 1;

        -- =========================
        -- LOCK + FETCH SEATS
        -- =========================

        DECLARE @AvailableSeats INT;

        SELECT @AvailableSeats = AvailableSeats
        FROM tbl_VehicleInstance WITH (UPDLOCK, ROWLOCK)
        WHERE InstanceId = @InstanceId;

        -- =========================
        -- INSERT BOOKING
        -- =========================

        INSERT INTO tbl_Booking
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

        -- =========================
        -- INSERT PASSENGERS
        -- =========================

        INSERT INTO tbl_Passenger
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
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY (SELECT 1)) <= @AvailableSeats
                THEN 'Confirmed'
                ELSE 'WaitingList'
            END
        FROM @Passengers p;

        -- =========================
        -- UPDATE SEATS
        -- =========================

        UPDATE tbl_VehicleInstance
        SET AvailableSeats =
            CASE 
                WHEN @AvailableSeats >= (SELECT COUNT(*) FROM @Passengers)
                THEN @AvailableSeats - (SELECT COUNT(*) FROM @Passengers)
                ELSE 0
            END
        WHERE InstanceId = @InstanceId;

        -- =========================
        -- NOTIFICATION
        -- =========================

        DECLARE @Message VARCHAR(500);

        IF (SELECT COUNT(*) FROM @Passengers) > @AvailableSeats
            SET @Message = 'Booking created with waiting list. PNR: ' + @PNR;
        ELSE
            SET @Message = 'Booking confirmed. PNR: ' + @PNR;

        INSERT INTO tbl_Notification (UserId, Title, Message)
        VALUES (@UserId, 'Booking Created', @Message);

        -- =========================
        -- RETURN RESULT
        -- =========================

        SELECT @BookingId AS BookingId, @PNR AS PNR;

        COMMIT TRANSACTION;
    END TRY

    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

select * from tbl_Coupon;
select * from tbl_User;
select * from tbl_TravelCompany;
select * from tbl_Vehicle;
select * from tbl_VehicleDocument;
select * from tbl_VehicleInstance;
select * from tbl_Route;
select * from tbl_RouteStopPoint;
select * from tbl_Pricing;
select * from tbl_Passenger;
select * from tbl_Payment;
select * from tbl_Booking;
select * from tbl_SeatLayout;
select * from tbl_Notification;
select * from tbl_Disruption;
select * from tbl_Review;
select * from tbl_Stop;
select * from tbl_Disruption;

select * from tbl_booking where status='cancelled';
