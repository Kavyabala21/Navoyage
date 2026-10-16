IF DB_ID(N'EndaVay_Catalog') IS NULL
BEGIN
    CREATE DATABASE EndaVay_Catalog;
END
GO

USE EndaVay_Catalog;
GO

IF OBJECT_ID(N'dbo.tbl_Route', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Route (
        RouteId         INT          IDENTITY(1,1) NOT NULL,
        TravelCompanyId INT                        NOT NULL,
        RouteName       VARCHAR(150)               NOT NULL,
        IsActive        BIT                        NOT NULL DEFAULT 1,
        CreatedOn       DATETIME                   NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn      DATETIME                   NULL,
        ParentRouteId   INT                        NULL,

        CONSTRAINT pk_Route        PRIMARY KEY (RouteId),
        CONSTRAINT fk_Route_Parent FOREIGN KEY (ParentRouteId) REFERENCES dbo.tbl_Route(RouteId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Stop', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Stop (
        StopId     INT          IDENTITY(1,1) NOT NULL,
        StopName   VARCHAR(100)               NOT NULL,
        Latitude   DECIMAL(10,6)              NOT NULL,
        Longitude  DECIMAL(10,6)              NOT NULL,
        CreatedOn  DATETIME                   NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn DATETIME                   NULL,

        CONSTRAINT pk_Stop          PRIMARY KEY (StopId),
        CONSTRAINT uq_Stop_StopName UNIQUE (StopName)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_RouteStopPoint', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_RouteStopPoint (
        RouteStopPointId INT      IDENTITY(1,1) NOT NULL,
        RouteId          INT                    NOT NULL,
        StopId           INT                    NOT NULL,
        SequenceOrder    INT                    NOT NULL,
        CreatedOn        DATETIME               NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedBy       INT                    NULL,
        ModifiedOn       DATETIME               NULL,
        IsActive         BIT                    NOT NULL DEFAULT 1,
        CreatedBy        INT                    NOT NULL,

        CONSTRAINT pk_RouteStopPoint       PRIMARY KEY (RouteStopPointId),
        CONSTRAINT fk_RouteStopPoint_Route FOREIGN KEY (RouteId) REFERENCES dbo.tbl_Route(RouteId),
        CONSTRAINT fk_RouteStopPoint_Stop  FOREIGN KEY (StopId) REFERENCES dbo.tbl_Stop(StopId),
        CONSTRAINT uq_Route_Stop           UNIQUE (RouteId, StopId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Pricing', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Pricing (
        PricingId     INT           IDENTITY(1,1) NOT NULL,
        VehicleId     INT                         NOT NULL,
        SeatClass     VARCHAR(50)                 NOT NULL,
        BasePrice     DECIMAL(10,2)               NOT NULL,
        SeasonType    VARCHAR(50)                 NULL,
        EffectiveFrom DATE                        NOT NULL,
        EffectiveTo   DATE                        NULL,
        CreatedOn     DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_Pricing           PRIMARY KEY (PricingId),
        CONSTRAINT ck_Pricing_BasePrice CHECK (BasePrice > 0)
    );
END
GO
