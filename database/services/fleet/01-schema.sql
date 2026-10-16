IF DB_ID(N'EndaVay_Fleet') IS NULL
BEGIN
    CREATE DATABASE EndaVay_Fleet;
END
GO

USE EndaVay_Fleet;
GO

IF OBJECT_ID(N'dbo.tbl_TravelCompany', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_TravelCompany (
        TravelCompanyId INT           IDENTITY(1,1) NOT NULL,
        OwnerId         INT                         NOT NULL,
        CompanyName     VARCHAR(150)                NOT NULL,
        Description     NVARCHAR(MAX)               NULL,
        IsActive        BIT                         NOT NULL DEFAULT 1,
        CreatedOn       DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_TravelCompany      PRIMARY KEY (TravelCompanyId),
        CONSTRAINT uq_TravelCompany_Name UNIQUE (CompanyName)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Vehicle', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Vehicle (
        VehicleId         INT           IDENTITY(1,1) NOT NULL,
        VehicleCode       VARCHAR(20)                 NOT NULL,
        TravelCompanyId   INT                         NOT NULL,
        ModeOfTransport   VARCHAR(20)                 NOT NULL,
        VehicleModel      VARCHAR(100)                NULL,
        Capacity          INT                         NOT NULL,
        VehicleImageUrl   NVARCHAR(MAX)               NULL,
        VehicleCondition  VARCHAR(20)                 NOT NULL,
        Description       NVARCHAR(MAX)               NULL,
        IsActive          BIT                         NOT NULL DEFAULT 1,
        CreatedOn         DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn        DATETIME                    NULL,
        ModifiedBy        INT                         NOT NULL,
        ConditionVerified BIT                         NOT NULL DEFAULT 0,

        CONSTRAINT pk_Vehicle               PRIMARY KEY (VehicleId),
        CONSTRAINT uq_Vehicle_Code          UNIQUE (VehicleCode),
        CONSTRAINT ck_Vehicle_Mode          CHECK (ModeOfTransport IN ('Bus','Train','Flight')),
        CONSTRAINT ck_Vehicle_Capacity      CHECK (Capacity > 0),
        CONSTRAINT ck_Vehicle_Condition     CHECK (VehicleCondition IN ('Good','Moderate','Bad','NeedApproval')),
        CONSTRAINT fk_Vehicle_TravelCompany FOREIGN KEY (TravelCompanyId) REFERENCES dbo.tbl_TravelCompany(TravelCompanyId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_VehicleDocument', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_VehicleDocument (
        DocumentId   INT           IDENTITY(1,1) NOT NULL,
        VehicleId    INT                         NOT NULL,
        DocumentName VARCHAR(200)                NOT NULL,
        DocumentUrl  NVARCHAR(MAX)               NOT NULL,
        UploadedOn   DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        UploadedBy   INT                         NOT NULL,
        Status       VARCHAR(20)                 NOT NULL DEFAULT 'Pending',
        AdminRemarks NVARCHAR(MAX)               NULL,

        CONSTRAINT pk_VehicleDocument        PRIMARY KEY (DocumentId),
        CONSTRAINT fk_VehicleDocumentVehicle FOREIGN KEY (VehicleId) REFERENCES dbo.tbl_Vehicle(VehicleId),
        CONSTRAINT ck_VehicleDocument_Status CHECK (Status IN ('Pending','Approved','Rejected'))
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_SeatLayout', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_SeatLayout (
        Id         INT           IDENTITY(1,1) NOT NULL,
        VehicleId  INT                         NOT NULL,
        LayoutJSON NVARCHAR(MAX)               NOT NULL,
        CreatedOn  DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn DATETIME                    NULL,

        CONSTRAINT pk_SeatLayout         PRIMARY KEY (Id),
        CONSTRAINT fk_SeatLayout_Vehicle FOREIGN KEY (VehicleId) REFERENCES dbo.tbl_Vehicle(VehicleId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_VehicleInstance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_VehicleInstance (
        InstanceId     INT         IDENTITY(1,1) NOT NULL,
        VehicleId      INT                       NOT NULL,
        RouteId        INT                       NOT NULL,
        DepartureDate  DATE                      NOT NULL,
        DepartureTime  TIME                      NOT NULL,
        ArrivalDate    DATE                      NOT NULL,
        ArrivalTime    TIME                      NOT NULL,
        TotalSeats     INT                       NOT NULL,
        AvailableSeats INT                       NOT NULL,
        Status         VARCHAR(20)               NOT NULL DEFAULT 'Scheduled',
        CreatedOn      DATETIME2                 NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn     DATETIME                  NULL,
        IsActive       BIT                       NOT NULL DEFAULT 1,
        ModifiedBy     INT                       NULL,

        CONSTRAINT pk_VehicleInstance        PRIMARY KEY (InstanceId),
        CONSTRAINT ck_VehicleInstance_Status CHECK (Status IN ('Scheduled','Delayed','Cancelled','Completed')),
        CONSTRAINT fk_VehicleInstanceVehicle FOREIGN KEY (VehicleId) REFERENCES dbo.tbl_Vehicle(VehicleId)
    );
END
GO
