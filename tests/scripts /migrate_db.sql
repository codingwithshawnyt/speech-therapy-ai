-- migrate_db.sql - Database migration script for StutterOn (replace with your app name)

-- This script demonstrates advanced SQL techniques and best practices for database migrations.

-- Set the role to the database owner (replace with your actual database owner role)
SET ROLE "stutteron_admin";

-- Begin transaction to ensure atomicity
BEGIN;

-- Create extensions (if not already created)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'therapist');
CREATE TYPE speech_event_type AS ENUM (
  'repetition',
  'prolongation',
  'block',
  'interjection',
  'revision'
);

-- Create tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  password TEXT NOT NULL CHECK (length(password) >= 8),
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Store user agent, IP address, location, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  type TEXT, -- e.g., 'fluency_shaping', 'real_time_analysis', 'ai_coach'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session exercises table (many-to-many relationship between sessions and exercises)
CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  user_input TEXT, -- Store user's response (text, audio data, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Speech events table
CREATE TABLE IF NOT EXISTS speech_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE CASCADE,
  event_type speech_event_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  details JSONB, -- Store additional information about the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  fluency_score NUMERIC(3, 2) NOT NULL CHECK (fluency_score BETWEEN 0 AND 1),
  speaking_rate NUMERIC(5, 2) NOT NULL,
  details JSONB, -- Store detailed analysis and feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Functions and triggers

-- Function to update updated_at timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamp
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_session_exercises_updated_at
BEFORE UPDATE ON session_exercises
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_speech_events_updated_at
BEFORE UPDATE ON speech_events
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
BEFORE UPDATE ON progress
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Data migration (optional)
-- If you have existing data, add scripts here to migrate it to the new schema
-- ...

-- Commit transaction
COMMIT;

-- Grant privileges (replace with your actual database user roles)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO stutteron_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stutteron_user;