IF DB_ID(N'EndaVay_Engagement') IS NULL
BEGIN
    CREATE DATABASE EndaVay_Engagement;
END
GO

USE EndaVay_Engagement;
GO

IF OBJECT_ID(N'dbo.tbl_Notification', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Notification (
        NotificationId INT          IDENTITY(1,1) NOT NULL,
        UserId         INT                        NOT NULL,
        Title          VARCHAR(150)               NOT NULL,
        Message        VARCHAR(500)               NOT NULL,
        IsRead         BIT                        NOT NULL DEFAULT 0,
        CreatedOn      DATETIME                   NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),

        CONSTRAINT pk_Notification PRIMARY KEY (NotificationId)
    );
END
GO

IF OBJECT_ID(N'dbo.tbl_Disruption', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Disruption (
        DisruptionId    INT           IDENTITY(1,1) NOT NULL,
        InstanceId      INT                         NOT NULL,
        RaisedBy        INT                         NOT NULL,
        Type            VARCHAR(20)                 NOT NULL,
        Description     NVARCHAR(MAX)               NULL,
        DisruptionStage VARCHAR(30)                 NOT NULL DEFAULT 'Raised',
        Status          VARCHAR(20)                 NOT NULL DEFAULT 'Pending',
        CreatedOn       DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ResolvedOn      DATETIME                    NULL,

        CONSTRAINT pk_Disruption        PRIMARY KEY (DisruptionId),
        CONSTRAINT ck_Disruption_Type   CHECK (Type IN ('Delay','Breakdown','Cancel')),
        CONSTRAINT ck_Disruption_Stage  CHECK (DisruptionStage IN ('Raised','InProgress','Resolved')),
        CONSTRAINT ck_Disruption_Status CHECK (Status IN ('Pending','Approved','Rejected'))
    );
END
GO
