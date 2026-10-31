-- Fix user approval defaults
-- This migration ensures the approved column has the correct default value

-- First, update the column default
ALTER TABLE users ALTER COLUMN approved SET DEFAULT false;

-- Update any existing users that might have inconsistent approval status
-- (This is safe because we want new registrations to be unapproved by default)
UPDATE users SET approved = false WHERE approved IS NULL;

-- Ensure the admin user is approved (if it exists)
UPDATE users SET approved = true WHERE email = 'admin@corex.com';
UPDATE users SET approved = true WHERE email = 'admin@corexltd.com';
UPDATE users SET approved = true WHERE role = 'admin';