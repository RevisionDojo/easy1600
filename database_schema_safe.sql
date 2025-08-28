-- SAT Prep Database Schema - PRODUCTION SAFE VERSION
-- Supports both MCQ and SPR question types from multiple data sources
-- This version uses CREATE IF NOT EXISTS and ALTER TABLE for safe migrations

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SAFE SCHEMA CREATION/MIGRATION
-- ============================================================================
-- This version will not drop existing tables or data
-- Use this for production deployments or when you want to preserve data

-- Users table for authentication and profile management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, premium, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- Official practice exam questions table (from ALLEXAMSONEPREP.json)
CREATE TABLE IF NOT EXISTS official_practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id INTEGER UNIQUE NOT NULL, -- Original question_id from JSON
    exam_id INTEGER NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    answer_type VARCHAR(10) NOT NULL CHECK (answer_type IN ('mcq', 'spr')),
    
    -- Question content
    stem_text TEXT,
    stem_html TEXT,
    
    -- Explanation content
    explanation_text TEXT,
    explanation_html TEXT,
    
    -- MCQ specific fields
    choices JSONB, -- Store array of choice objects with id, letter, html, text, is_correct
    
    -- SPR specific fields
    spr_answers JSONB, -- Store array of acceptable answers
    
    -- Metadata
    meta JSONB, -- Store original meta object with answer_choices_status, is_marked_for_review
    
    -- Derived fields for easier querying
    subject VARCHAR(50), -- math, english (derived from exam_name)
    module VARCHAR(50), -- module1, module2 (derived from exam_name)
    difficulty VARCHAR(20), -- Can be derived or set based on exam type
    
    -- Source tracking
    scraped_at TIMESTAMP WITH TIME ZONE,
    first_question_id INTEGER, -- Reference to first question in exam for grouping
    questions_count INTEGER, -- Total questions in this exam
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Official question bank table (from oneprep_sat_suite_questionbank.json and princetonreview.json)
CREATE TABLE IF NOT EXISTS op_question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id INTEGER UNIQUE NOT NULL, -- Original question_id from JSON
    question_url VARCHAR(500),
    uuid VARCHAR(100),
    
    -- Source identification
    source VARCHAR(50) NOT NULL CHECK (source IN ('collegeboard', 'princeton')), -- collegeboard for oneprep_sat_suite, princeton for princetonreview
    
    -- Question classification
    difficulty VARCHAR(10), -- E, M, H (Easy, Medium, Hard)
    source_order INTEGER,
    primary_class VARCHAR(50), -- CAS, EOI, H, INI, etc.
    skill VARCHAR(50), -- WIC, TSP, SYN, etc.
    module VARCHAR(50), -- en, math
    
    -- Question content
    answer_type VARCHAR(10) NOT NULL CHECK (answer_type IN ('mcq', 'spr')),
    stem_text TEXT,
    stem_html TEXT,
    
    -- MCQ specific fields
    answer_choices JSONB, -- Store array of choice objects with explanations
    correct_choice_letter VARCHAR(1),
    
    -- SPR specific fields
    spr_answers JSONB, -- Store array of acceptable answers
    
    -- Explanation content
    explanation_text TEXT,
    explanation_html TEXT,
    
    -- Princeton Review specific fields
    stimulus_text TEXT, -- For Princeton Review questions
    stimulus_html TEXT, -- For Princeton Review questions
    
    -- Metadata and classification
    meta JSONB, -- Store section, domain, skill info for Princeton Review
    seed_args JSONB, -- Store array of seed arguments (College Board)
    from_seeds JSONB, -- Store array of seed URLs (College Board)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add source column if it doesn't exist (for existing installations)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'op_question_bank' AND column_name = 'source') THEN
        ALTER TABLE op_question_bank ADD COLUMN source VARCHAR(50) CHECK (source IN ('collegeboard', 'princeton'));
        -- Set default values for existing records
        UPDATE op_question_bank SET source = 'collegeboard' WHERE source IS NULL;
        -- Make it NOT NULL after setting defaults
        ALTER TABLE op_question_bank ALTER COLUMN source SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'op_question_bank' AND column_name = 'stimulus_text') THEN
        ALTER TABLE op_question_bank ADD COLUMN stimulus_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'op_question_bank' AND column_name = 'stimulus_html') THEN
        ALTER TABLE op_question_bank ADD COLUMN stimulus_html TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'op_question_bank' AND column_name = 'meta') THEN
        ALTER TABLE op_question_bank ADD COLUMN meta JSONB;
    END IF;
END $$;

-- Bluebook test questions table (from bluebookplus_tests_output)
CREATE TABLE IF NOT EXISTS bluebook_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id VARCHAR(100) NOT NULL, -- UUID from metadata
    subject VARCHAR(50) NOT NULL, -- English, Math
    test_name VARCHAR(255) NOT NULL,
    test_date VARCHAR(20), -- YYYY.MM format
    module VARCHAR(20), -- module1, module2
    vip INTEGER DEFAULT 0,
    fetched_at TIMESTAMP WITH TIME ZONE,
    
    -- Question content
    question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('choice', 'spr')),
    article TEXT, -- Context/passage for the question
    question TEXT, -- The actual question text
    
    -- MCQ specific fields
    options JSONB, -- Store array of option objects {name, content}
    correct_answer TEXT, -- The correct answer text
    
    -- SPR specific fields
    spr_answers JSONB, -- Store array of acceptable answers
    
    -- Solution/explanation
    solution TEXT,
    
    -- Position in test
    question_order INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exams/Tests table for tracking complete exams
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    exam_type VARCHAR(50) NOT NULL, -- 'official_practice', 'bluebook', 'custom'
    subject VARCHAR(50) NOT NULL, -- 'math', 'english', 'both'
    module VARCHAR(50), -- 'module1', 'module2', null for full tests
    
    -- Reference to source data
    source_exam_id INTEGER, -- Maps to exam_id in official practice tests or test_id in bluebook
    source_test_id VARCHAR(100), -- Maps to test_id in bluebook tests
    
    -- Exam metadata
    total_questions INTEGER NOT NULL DEFAULT 0,
    time_limit_minutes INTEGER, -- Time limit in minutes
    difficulty_level VARCHAR(20), -- easy, medium, hard
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User exam attempts/sessions
CREATE TABLE IF NOT EXISTS user_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    
    -- Attempt tracking
    attempt_number INTEGER NOT NULL DEFAULT 1,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Scoring
    total_questions INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score_percentage DECIMAL(5,2), -- 0.00 to 100.00
    
    -- Progress tracking
    current_question_index INTEGER DEFAULT 0,
    questions_flagged INTEGER DEFAULT 0,
    
    -- Metadata
    exam_data JSONB, -- Store exam configuration snapshot
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, exam_id, attempt_number)
);

-- User question responses
CREATE TABLE IF NOT EXISTS user_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_exam_id UUID REFERENCES user_exams(id) ON DELETE CASCADE, -- NULL for practice questions
    
    -- Question reference (polymorphic - can reference any question table)
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('official_practice', 'op_bank', 'bluebook')),
    question_id UUID NOT NULL, -- References id in respective question table
    original_question_id INTEGER, -- Original question_id from JSON for easier lookups
    
    -- Response data
    answer_type VARCHAR(10) NOT NULL CHECK (answer_type IN ('mcq', 'spr')),
    
    -- MCQ response
    selected_choice_letter VARCHAR(1), -- A, B, C, D
    selected_choice_text TEXT,
    
    -- SPR response
    spr_response TEXT, -- User's typed answer for SPR questions
    
    -- Correctness
    is_correct BOOLEAN,
    is_partially_correct BOOLEAN DEFAULT false, -- For SPR questions with multiple acceptable formats
    
    -- Timing and behavior
    time_spent_seconds INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    attempt_count INTEGER DEFAULT 1, -- How many times user attempted this question
    
    -- Response metadata
    response_data JSONB, -- Store additional response metadata
    
    -- Timestamps
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User study sessions (for tracking study time and patterns)
CREATE TABLE IF NOT EXISTS user_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    session_type VARCHAR(50) NOT NULL, -- 'practice', 'exam', 'review'
    subject VARCHAR(50), -- 'math', 'english'
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Activity summary
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    
    -- Metadata
    session_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES (CREATE IF NOT EXISTS equivalent)
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Official practice questions indexes
CREATE INDEX IF NOT EXISTS idx_official_practice_exam_id ON official_practice_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_official_practice_subject ON official_practice_questions(subject);
CREATE INDEX IF NOT EXISTS idx_official_practice_answer_type ON official_practice_questions(answer_type);
CREATE INDEX IF NOT EXISTS idx_official_practice_difficulty ON official_practice_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_official_practice_scraped_at ON official_practice_questions(scraped_at);

-- OP question bank indexes
CREATE INDEX IF NOT EXISTS idx_op_questions_source ON op_question_bank(source);
CREATE INDEX IF NOT EXISTS idx_op_questions_difficulty ON op_question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_op_questions_primary_class ON op_question_bank(primary_class);
CREATE INDEX IF NOT EXISTS idx_op_questions_skill ON op_question_bank(skill);
CREATE INDEX IF NOT EXISTS idx_op_questions_module ON op_question_bank(module);
CREATE INDEX IF NOT EXISTS idx_op_questions_answer_type ON op_question_bank(answer_type);

-- Bluebook test questions indexes
CREATE INDEX IF NOT EXISTS idx_bluebook_test_id ON bluebook_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_bluebook_subject ON bluebook_test_questions(subject);
CREATE INDEX IF NOT EXISTS idx_bluebook_test_name ON bluebook_test_questions(test_name);
CREATE INDEX IF NOT EXISTS idx_bluebook_question_type ON bluebook_test_questions(question_type);

-- Exams table indexes
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject);
CREATE INDEX IF NOT EXISTS idx_exams_is_active ON exams(is_active);
CREATE INDEX IF NOT EXISTS idx_exams_is_featured ON exams(is_featured);

-- User exams indexes
CREATE INDEX IF NOT EXISTS idx_user_exams_user_id ON user_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_exam_id ON user_exams(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_status ON user_exams(status);
CREATE INDEX IF NOT EXISTS idx_user_exams_created_at ON user_exams(created_at);

-- User questions indexes
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_exam_id ON user_questions(user_exam_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_question_type ON user_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_user_questions_question_id ON user_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_is_correct ON user_questions(is_correct);
CREATE INDEX IF NOT EXISTS idx_user_questions_answered_at ON user_questions(answered_at);

-- User study sessions indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON user_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_session_type ON user_study_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON user_study_sessions(started_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_questions_user_correct ON user_questions(user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_user_exams_user_status ON user_exams(user_id, status);
CREATE INDEX IF NOT EXISTS idx_official_practice_subject_type ON official_practice_questions(subject, answer_type);
CREATE INDEX IF NOT EXISTS idx_op_questions_source_module ON op_question_bank(source, module);
CREATE INDEX IF NOT EXISTS idx_op_questions_module_class ON op_question_bank(module, primary_class);

-- ============================================================================
-- FUNCTIONS (CREATE OR REPLACE for safe updates)
-- ============================================================================

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to set user context (call this after authentication)
CREATE OR REPLACE FUNCTION set_user_context(user_uuid uuid, user_role text DEFAULT 'user')
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_uuid::text, true);
    PERFORM set_config('app.user_role', user_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN current_setting('app.user_role', true) = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable service mode (for data migrations, admin operations)
CREATE OR REPLACE FUNCTION enable_service_mode()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.bypass_rls', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable service mode
CREATE OR REPLACE FUNCTION disable_service_mode()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS (DROP and CREATE for safe updates)
-- ============================================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_official_practice_updated_at ON official_practice_questions;
DROP TRIGGER IF EXISTS update_op_questions_updated_at ON op_question_bank;
DROP TRIGGER IF EXISTS update_bluebook_questions_updated_at ON bluebook_test_questions;
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
DROP TRIGGER IF EXISTS update_user_exams_updated_at ON user_exams;
DROP TRIGGER IF EXISTS update_user_questions_updated_at ON user_questions;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_official_practice_updated_at BEFORE UPDATE ON official_practice_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_op_questions_updated_at BEFORE UPDATE ON op_question_bank FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bluebook_questions_updated_at BEFORE UPDATE ON bluebook_test_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_exams_updated_at BEFORE UPDATE ON user_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_questions_updated_at BEFORE UPDATE ON user_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (CREATE OR REPLACE for safe updates)
-- ============================================================================

-- View for user performance summary
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT ue.id) as total_exams_taken,
    COUNT(DISTINCT CASE WHEN ue.status = 'completed' THEN ue.id END) as completed_exams,
    COUNT(DISTINCT uq.id) as total_questions_answered,
    COUNT(DISTINCT CASE WHEN uq.is_correct = true THEN uq.id END) as correct_answers,
    CASE 
        WHEN COUNT(DISTINCT uq.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN uq.is_correct = true THEN uq.id END) * 100.0 / COUNT(DISTINCT uq.id)), 2)
        ELSE 0 
    END as overall_accuracy_percentage,
    AVG(ue.score_percentage) as average_exam_score,
    SUM(uss.duration_seconds) as total_study_time_seconds
FROM users u
LEFT JOIN user_exams ue ON u.id = ue.user_id
LEFT JOIN user_questions uq ON u.id = uq.user_id
LEFT JOIN user_study_sessions uss ON u.id = uss.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- View for question difficulty analysis
CREATE OR REPLACE VIEW question_difficulty_stats AS
SELECT 
    'official_practice' as source_type,
    opq.subject,
    opq.difficulty,
    opq.answer_type,
    COUNT(*) as question_count,
    AVG(CASE WHEN uq.is_correct IS NOT NULL THEN 
        CASE WHEN uq.is_correct THEN 1.0 ELSE 0.0 END 
    END) as average_correctness_rate
FROM official_practice_questions opq
LEFT JOIN user_questions uq ON opq.id = uq.question_id AND uq.question_type = 'official_practice'
GROUP BY opq.subject, opq.difficulty, opq.answer_type

UNION ALL

SELECT 
    CONCAT('op_bank_', opq.source) as source_type,
    opq.module as subject,
    opq.difficulty,
    opq.answer_type,
    COUNT(*) as question_count,
    AVG(CASE WHEN uq.is_correct IS NOT NULL THEN 
        CASE WHEN uq.is_correct THEN 1.0 ELSE 0.0 END 
    END) as average_correctness_rate
FROM op_question_bank opq
LEFT JOIN user_questions uq ON opq.id = uq.question_id AND uq.question_type = 'op_bank'
GROUP BY opq.source, opq.module, opq.difficulty, opq.answer_type

UNION ALL

SELECT 
    'bluebook' as source_type,
    btq.subject,
    'unknown' as difficulty,
    btq.question_type as answer_type,
    COUNT(*) as question_count,
    AVG(CASE WHEN uq.is_correct IS NOT NULL THEN 
        CASE WHEN uq.is_correct THEN 1.0 ELSE 0.0 END 
    END) as average_correctness_rate
FROM bluebook_test_questions btq
LEFT JOIN user_questions uq ON btq.id = uq.question_id AND uq.question_type = 'bluebook'
GROUP BY btq.subject, btq.question_type;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE bluebook_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe way to update them)
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS users_public_info ON users;
DROP POLICY IF EXISTS official_practice_questions_read ON official_practice_questions;
DROP POLICY IF EXISTS op_questions_read ON op_question_bank;
DROP POLICY IF EXISTS bluebook_questions_read ON bluebook_test_questions;
DROP POLICY IF EXISTS official_practice_questions_admin_modify ON official_practice_questions;
DROP POLICY IF EXISTS op_questions_admin_modify ON op_question_bank;
DROP POLICY IF EXISTS bluebook_questions_admin_modify ON bluebook_test_questions;
DROP POLICY IF EXISTS exams_read ON exams;
DROP POLICY IF EXISTS exams_admin_modify ON exams;
DROP POLICY IF EXISTS user_exams_own_data ON user_exams;
DROP POLICY IF EXISTS user_exams_public_stats ON user_exams;
DROP POLICY IF EXISTS user_questions_own_data ON user_questions;
DROP POLICY IF EXISTS user_study_sessions_own_data ON user_study_sessions;
DROP POLICY IF EXISTS bypass_rls_for_service ON users;
DROP POLICY IF EXISTS bypass_rls_for_service_official_practice ON official_practice_questions;
DROP POLICY IF EXISTS bypass_rls_for_service_op_questions ON op_question_bank;
DROP POLICY IF EXISTS bypass_rls_for_service_bluebook ON bluebook_test_questions;
DROP POLICY IF EXISTS bypass_rls_for_service_user_exams ON user_exams;
DROP POLICY IF EXISTS bypass_rls_for_service_user_questions ON user_questions;
DROP POLICY IF EXISTS bypass_rls_for_service_user_sessions ON user_study_sessions;

-- Create RLS policies
-- Users can only see and modify their own profile
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::uuid)
    WITH CHECK (id = current_setting('app.current_user_id')::uuid);

-- Allow users to view other users' basic info for leaderboards (optional)
CREATE POLICY users_public_info ON users
    FOR SELECT
    USING (true);

-- All authenticated users can read questions (they're public content)
CREATE POLICY official_practice_questions_read ON official_practice_questions
    FOR SELECT
    USING (true);

CREATE POLICY op_questions_read ON op_question_bank
    FOR SELECT
    USING (true);

CREATE POLICY bluebook_questions_read ON bluebook_test_questions
    FOR SELECT
    USING (true);

-- Only admins can modify questions
CREATE POLICY official_practice_questions_admin_modify ON official_practice_questions
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin')
    WITH CHECK (current_setting('app.user_role', true) = 'admin');

CREATE POLICY op_questions_admin_modify ON op_question_bank
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin')
    WITH CHECK (current_setting('app.user_role', true) = 'admin');

CREATE POLICY bluebook_questions_admin_modify ON bluebook_test_questions
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin')
    WITH CHECK (current_setting('app.user_role', true) = 'admin');

-- All authenticated users can read active exams
CREATE POLICY exams_read ON exams
    FOR SELECT
    USING (is_active = true);

-- Only admins can modify exams
CREATE POLICY exams_admin_modify ON exams
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin')
    WITH CHECK (current_setting('app.user_role', true) = 'admin');

-- Users can only see and modify their own exam attempts
CREATE POLICY user_exams_own_data ON user_exams
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid)
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Allow reading exam attempts for leaderboards/rankings (optional)
CREATE POLICY user_exams_public_stats ON user_exams
    FOR SELECT
    USING (status = 'completed');

-- Users can only see and modify their own question responses
CREATE POLICY user_questions_own_data ON user_questions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid)
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Users can only see and modify their own study sessions
CREATE POLICY user_study_sessions_own_data ON user_study_sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid)
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Bypass RLS for service/system operations (use carefully)
CREATE POLICY bypass_rls_for_service ON users
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_official_practice ON official_practice_questions
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_op_questions ON op_question_bank
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_bluebook ON bluebook_test_questions
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_user_exams ON user_exams
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_user_questions ON user_questions
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY bypass_rls_for_service_user_sessions ON user_study_sessions
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE official_practice_questions IS 'Official practice exam questions from ALLEXAMSONEPREP.json (College Board practice tests)';
COMMENT ON TABLE op_question_bank IS 'Question bank from oneprep_sat_suite_questionbank.json (College Board) and princetonreview.json (Princeton Review)';
COMMENT ON TABLE bluebook_test_questions IS 'Questions from Bluebook practice tests (bluebookplus_tests_output)';
COMMENT ON TABLE exams IS 'Organized exam/test definitions that group questions together';
COMMENT ON TABLE user_exams IS 'User attempts at specific exams with completion tracking';
COMMENT ON TABLE user_questions IS 'Individual question responses and performance tracking';
COMMENT ON TABLE user_study_sessions IS 'Study session tracking for analytics and progress monitoring';

COMMENT ON COLUMN official_practice_questions.choices IS 'JSONB array of choice objects with id, letter, html, text, is_correct fields';
COMMENT ON COLUMN official_practice_questions.spr_answers IS 'JSONB array of acceptable string answers for SPR questions';
COMMENT ON COLUMN official_practice_questions.meta IS 'JSONB object with answer_choices_status and is_marked_for_review fields';
COMMENT ON COLUMN op_question_bank.source IS 'Source of the question: collegeboard (oneprep_sat_suite) or princeton (princetonreview)';
COMMENT ON COLUMN op_question_bank.answer_choices IS 'JSONB array of choice objects with id, text, letter, order, is_correct, explanation fields';
COMMENT ON COLUMN op_question_bank.stimulus_text IS 'Princeton Review question stimulus/context text';
COMMENT ON COLUMN op_question_bank.meta IS 'JSONB object with section, domain, skill info (Princeton Review)';
COMMENT ON COLUMN bluebook_test_questions.options IS 'JSONB array of option objects with name and content fields';
COMMENT ON COLUMN user_questions.question_type IS 'Discriminator field indicating which question table this references (official_practice, op_bank, bluebook)';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SAT Prep Database Schema (Safe Version) - Setup Complete!';
    RAISE NOTICE '📊 Tables: users, official_practice_questions, op_question_bank, bluebook_test_questions, exams, user_exams, user_questions, user_study_sessions';
    RAISE NOTICE '🔒 Row Level Security: Enabled with appropriate policies';
    RAISE NOTICE '📈 Views: user_performance_summary, question_difficulty_stats';
    RAISE NOTICE '⚡ Indexes: Optimized for common query patterns';
    RAISE NOTICE '🛠️  Functions: User context, admin checks, service mode';
END $$;
