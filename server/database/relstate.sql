-- Run once as a PostgreSQL superuser:
--   CREATE DATABASE relstate;
-- Then connect to the new database and run this file:
--   psql -U postgres -d relstate -f database/relstate.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(250) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  type VARCHAR(30) NOT NULL DEFAULT 'house' CHECK (type IN ('apartment','house','land','office','commercial','other')),
  bedrooms SMALLINT NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms SMALLINT NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  area_sqm NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (area_sqm >= 0),
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published')),
  created_by UUID NOT NULL REFERENCES administrators(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS properties_status_created_idx ON properties (status, created_at DESC);
CREATE INDEX IF NOT EXISTS properties_location_idx ON properties USING GIN (location);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS properties_featured_idx ON properties (featured, created_at DESC);

-- Messages submitted from the public Contact page. These are surfaced in the
-- administrator dashboard under Inquiries & Support.
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL,
  sender_address VARCHAR(500) NOT NULL DEFAULT '',
  subject VARCHAR(250) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sender_address VARCHAR(500) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS support_tickets_status_activity_idx
  ON support_tickets (status, last_activity_at DESC);
