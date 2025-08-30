-- Migration to add online and last_login columns to user table
ALTER TABLE user ADD COLUMN online BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE user ADD COLUMN last_login DATETIME NULL;
