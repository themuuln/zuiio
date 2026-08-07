-- Fix enum ordering: add all granular roles before they're referenced
-- PG17 blocks using newly-added enum values in the same transaction (55P04)
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'viewer';
