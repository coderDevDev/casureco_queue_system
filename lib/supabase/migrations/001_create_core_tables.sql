-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE ticket_status AS ENUM ('waiting', 'serving', 'done', 'skipped', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'staff', 'kiosk', 'display');
CREATE TYPE deployment_mode AS ENUM ('hybrid', 'cloud_only', 'local_only');

-- =====================================================
-- BRANCHES TABLE
-- =====================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    mode deployment_mode DEFAULT 'hybrid',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USERS/PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'staff',
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICES TABLE
-- =====================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    description TEXT,
    avg_service_time INTEGER DEFAULT 300, -- in seconds (5 minutes default)
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#3b82f6', -- for UI display
    icon TEXT, -- icon name for UI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(prefix, branch_id)
);

-- =====================================================
-- COUNTERS TABLE
-- =====================================================
CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, branch_id)
);

-- =====================================================
-- TICKETS TABLE (Main Queue Table)
-- =====================================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    status ticket_status DEFAULT 'waiting',
    priority_level INTEGER DEFAULT 0, -- 0=normal, 1=senior/PWD, 2=emergency
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    kiosk_id TEXT, -- identifier for kiosk machine
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    
    -- Timestamps for tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Additional info
    notes TEXT,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    served_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- For offline sync
    synced BOOLEAN DEFAULT true,
    sync_version INTEGER DEFAULT 1,
    
    -- Customer info (optional, minimal PII)
    customer_name TEXT,
    customer_phone TEXT,
    
    UNIQUE(ticket_number, branch_id)
);

-- =====================================================
-- TICKET SEQUENCE TABLE (for generating ticket numbers)
-- =====================================================
CREATE TABLE ticket_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    current_number INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, branch_id, date)
);

-- =====================================================
-- AUDIT LOGS TABLE (for compliance and tracking)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, CALL, SKIP, etc.
    old_data JSONB,
    new_data JSONB,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role user_role,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, key)
);

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, emergency
    is_active BOOLEAN DEFAULT true,
    display_duration INTEGER DEFAULT 10, -- seconds
    priority INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Tickets indexes (most queried table)
CREATE INDEX idx_tickets_status ON tickets(status) WHERE status IN ('waiting', 'serving');
CREATE INDEX idx_tickets_service_status ON tickets(service_id, status);
CREATE INDEX idx_tickets_branch_status ON tickets(branch_id, status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_counter_id ON tickets(counter_id) WHERE counter_id IS NOT NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority_level DESC, created_at ASC);

-- Counters indexes
CREATE INDEX idx_counters_branch_active ON counters(branch_id, is_active);
CREATE INDEX idx_counters_staff ON counters(staff_id) WHERE staff_id IS NOT NULL;

-- Services indexes
CREATE INDEX idx_services_branch_active ON services(branch_id, is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_branch ON audit_logs(branch_id, created_at DESC);

-- Users indexes
CREATE INDEX idx_users_branch_role ON users(branch_id, role);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_sequences_updated_at BEFORE UPDATE ON ticket_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================
COMMENT ON TABLE tickets IS 'Main queue tickets table with status tracking';
COMMENT ON TABLE counters IS 'Service counters/windows for staff';
COMMENT ON TABLE services IS 'Service types with prefixes (e.g., A=Registration, B=Cashier)';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and debugging';
COMMENT ON COLUMN tickets.priority_level IS '0=normal, 1=senior/PWD, 2=emergency';
COMMENT ON COLUMN tickets.synced IS 'Flag for offline-first sync mechanism';