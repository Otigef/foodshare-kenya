-- Add 'superadmin' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Add 'superadmin' to user_role enum for profiles compatibility
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superadmin';