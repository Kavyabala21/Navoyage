IF DB_ID(N'EndaVay_Identity') IS NULL
BEGIN
    CREATE DATABASE EndaVay_Identity;
END
GO

USE EndaVay_Identity;
GO

IF OBJECT_ID(N'dbo.tbl_User', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_User (
        UserId        INT           IDENTITY(1,1) NOT NULL,
        FullName      VARCHAR(150)                NOT NULL,
        Email         VARCHAR(150)                NOT NULL,
        PhoneNumber   VARCHAR(20)                 NOT NULL,
        Password      VARCHAR(200)                NOT NULL,
        Role          VARCHAR(20)                 NOT NULL,
        IsActive      BIT                         NOT NULL DEFAULT 1,
        CreatedOn     DATETIME                    NOT NULL DEFAULT DATEADD(MINUTE, 330, GETUTCDATE()),
        ModifiedOn    DATETIME                    NULL,
        ModifiedBy    INT                         NULL,

        CONSTRAINT pk_User          PRIMARY KEY (UserId),
        CONSTRAINT uk_User_UserName UNIQUE (FullName),
        CONSTRAINT uq_User_Email    UNIQUE (Email),
        CONSTRAINT uq_User_Phone    UNIQUE (PhoneNumber),
        CONSTRAINT ck_User_Email    CHECK (Email LIKE '%_@_%.__%'),
        CONSTRAINT ck_User_Phone    CHECK (PhoneNumber LIKE '+[0-9]%' AND LEN(PhoneNumber) BETWEEN 8 AND 20),
        CONSTRAINT ck_User_Role     CHECK (Role IN ('Admin','TravelCompanyOwner','Customer'))
    );
END
GO
