IF DB_ID('EVENTZEN') IS NULL
BEGIN
    CREATE DATABASE EVENTZEN;
END;
GO

USE EVENTZEN;
GO


EXEC('IF OBJECT_ID(''dbo.users'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.users (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL
	)
END');

EXEC('IF OBJECT_ID(''dbo.venues'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.venues (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		state VARCHAR(100),
		city VARCHAR(100),
		country VARCHAR(100),
		pincode VARCHAR(20),
		address VARCHAR(500),
		type VARCHAR(100) NOT NULL,
		capacity INT,
		description VARCHAR(500),
		amenities VARCHAR(500),
		price_per_hour DECIMAL(10,2),
		rating DECIMAL(2,1),
		image_url VARCHAR(500),
		is_active BIT NOT NULL DEFAULT 1,
		created_at DATETIME NOT NULL DEFAULT GETDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETDATE()
	)
END');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.events (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description VARCHAR(500),
		event_date DATE NOT NULL,
		start_time TIME NOT NULL,
		end_time TIME NOT NULL,
		venue_id BIGINT NOT NULL,
		venue_cost DECIMAL(10,2),
		ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
		max_capacity INT,
		ticket_available INT NOT NULL DEFAULT 0,
		status VARCHAR(50) NOT NULL DEFAULT ''ACTIVE'',
		created_at DATETIME NOT NULL DEFAULT GETDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETDATE(),
		CONSTRAINT fk_event_venue FOREIGN KEY (venue_id) REFERENCES dbo.venues(id)
	)
END');

EXEC('IF OBJECT_ID(''dbo.bookings'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.bookings (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		user_id BIGINT NOT NULL,
		event_id BIGINT NOT NULL,
		number_of_seats INT NOT NULL,
		price_per_ticket DECIMAL(10,2) NOT NULL,
		total_price DECIMAL(10,2) NOT NULL,
		booking_time DATETIME NOT NULL DEFAULT GETDATE(),
		status VARCHAR(50) NOT NULL DEFAULT ''CONFIRMED'',
		created_at DATETIME NOT NULL DEFAULT GETDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETDATE(),
		CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
		CONSTRAINT fk_booking_event FOREIGN KEY (event_id) REFERENCES dbo.events(id)
	)
END');

EXEC('IF OBJECT_ID(''dbo.vendors'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.vendors (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		service_type VARCHAR(100) NOT NULL,
		contact_person VARCHAR(255) NOT NULL,
		phone VARCHAR(30) NOT NULL,
		email VARCHAR(255) NOT NULL,
		price DECIMAL(10,2) NOT NULL,
		is_active BIT NOT NULL DEFAULT 1,
		created_at DATETIME NOT NULL DEFAULT GETDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETDATE()
	)
END');

EXEC('IF OBJECT_ID(''dbo.event_vendors'', ''U'') IS NULL
BEGIN
	CREATE TABLE dbo.event_vendors (
		id BIGINT IDENTITY(1,1) PRIMARY KEY,
		event_id BIGINT NOT NULL,
		vendor_id BIGINT NOT NULL,
		purpose VARCHAR(500),
		cost DECIMAL(10,2) NOT NULL,
		created_at DATETIME NOT NULL DEFAULT GETDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETDATE(),
		CONSTRAINT fk_event_vendor_event FOREIGN KEY (event_id) REFERENCES dbo.events(id),
		CONSTRAINT fk_event_vendor_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
		CONSTRAINT uk_event_vendor UNIQUE (event_id, vendor_id)
	)
END');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND COL_LENGTH(''dbo.events'', ''ticket_price'') IS NULL ALTER TABLE dbo.events ADD ticket_price DECIMAL(10,2) NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND COL_LENGTH(''dbo.events'', ''venue_cost'') IS NULL ALTER TABLE dbo.events ADD venue_cost DECIMAL(10,2) NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND COL_LENGTH(''dbo.events'', ''ticket_available'') IS NULL ALTER TABLE dbo.events ADD ticket_available INT NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND COL_LENGTH(''dbo.events'', ''price'') IS NOT NULL UPDATE dbo.events SET ticket_price = COALESCE(ticket_price, price) WHERE ticket_price IS NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL UPDATE dbo.events SET ticket_price = 0 WHERE ticket_price IS NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL UPDATE dbo.events SET ticket_available = COALESCE(ticket_available, max_capacity, 0) WHERE ticket_available IS NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.default_constraints dc JOIN sys.columns c ON c.default_object_id = dc.object_id JOIN sys.tables t ON t.object_id = c.object_id WHERE t.name = ''events'' AND c.name = ''ticket_price'') ALTER TABLE dbo.events ADD CONSTRAINT DF_events_ticket_price DEFAULT (0) FOR ticket_price');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.default_constraints dc JOIN sys.columns c ON c.default_object_id = dc.object_id JOIN sys.tables t ON t.object_id = c.object_id WHERE t.name = ''events'' AND c.name = ''ticket_available'') ALTER TABLE dbo.events ADD CONSTRAINT DF_events_ticket_available DEFAULT (0) FOR ticket_available');

EXEC('IF OBJECT_ID(''dbo.event_vendors'', ''U'') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.key_constraints kc WHERE kc.[type] = ''UQ'' AND kc.[name] = ''uk_event_vendor'') ALTER TABLE dbo.event_vendors ADD CONSTRAINT uk_event_vendor UNIQUE (event_id, vendor_id)');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL ALTER TABLE dbo.events ALTER COLUMN ticket_price DECIMAL(10,2) NOT NULL');

EXEC('IF OBJECT_ID(''dbo.events'', ''U'') IS NOT NULL ALTER TABLE dbo.events ALTER COLUMN ticket_available INT NOT NULL');
