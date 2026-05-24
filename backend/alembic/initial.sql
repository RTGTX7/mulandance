-- Dance Organization Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'public' CHECK (role IN ('admin', 'faculty', 'student', 'parent', 'alumni', 'public')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs & Classes
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    level VARCHAR(100),
    syllabus_ref VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE program_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    max_capacity INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    academic_year VARCHAR(9),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL,
    status VARCHAR(50) DEFAULT 'enrolled',
    payment_status VARCHAR(50) DEFAULT 'pending',
    enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performances & Events
CREATE TABLE performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    venue VARCHAR(200),
    cover_image VARCHAR(500),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performance_cast (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
    dancer_id UUID REFERENCES users(id),
    role VARCHAR(200)
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(200),
    event_type VARCHAR(50),
    cover_image VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'registered'
);

-- Content
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    summary TEXT,
    body TEXT,
    author_id UUID REFERENCES users(id),
    published_at TIMESTAMPTZ,
    cover_image VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    caption VARCHAR(300),
    order_index INTEGER DEFAULT 0
);

CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    quote TEXT NOT NULL,
    image_url VARCHAR(500),
    program_affiliation VARCHAR(200),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations & Memberships
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    frequency VARCHAR(20) DEFAULT 'one-time',
    payment_intent_id VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_id VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue
CREATE TABLE venue_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    capacity INTEGER,
    amenities JSONB,
    hourly_rate NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE venue_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venue_spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_programs_slug ON programs(slug);
CREATE INDEX idx_programs_category ON programs(category);
CREATE INDEX idx_performances_slug ON performances(slug);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_news_slug ON news_articles(slug);
CREATE INDEX idx_news_published ON news_articles(is_published, published_at);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_schedule ON enrollments(class_schedule_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_gallery_items_album ON gallery_items(album_id);
