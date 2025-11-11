-- =====================================================
-- SEED DATA FOR DEVELOPMENT/TESTING
-- =====================================================

-- Insert default branch
INSERT INTO branches (id, name, mode, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Main Branch', 'hybrid', true);

-- Insert default services
INSERT INTO services (id, name, prefix, avg_service_time, branch_id, color, icon) VALUES
('10000000-0000-0000-0000-000000000001', 'Registration', 'A', 300, '00000000-0000-0000-0000-000000000001', '#3b82f6', 'clipboard'),
('10000000-0000-0000-0000-000000000002', 'Cashier', 'B', 180, '00000000-0000-0000-0000-000000000001', '#10b981', 'dollar-sign'),
('10000000-0000-0000-0000-000000000003', 'Information', 'C', 240, '00000000-0000-0000-0000-000000000001', '#f59e0b', 'info'),
('10000000-0000-0000-0000-000000000004', 'Medical', 'D', 600, '00000000-0000-0000-0000-000000000001', '#ef4444', 'heart-pulse');

-- Insert default counters
INSERT INTO counters (id, name, branch_id, is_active) VALUES
('20000000-0000-0000-0000-000000000001', 'Counter 1', '00000000-0000-0000-0000-000000000001', true),
('20000000-0000-0000-0000-000000000002', 'Counter 2', '00000000-0000-0000-0000-000000000001', true),
('20000000-0000-0000-0000-000000000003', 'Counter 3', '00000000-0000-0000-0000-000000000001', true),
('20000000-0000-0000-0000-000000000004', 'Counter 4', '00000000-0000-0000-0000-000000000001', true);

-- Insert default system settings
INSERT INTO system_settings (branch_id, key, value, description) VALUES
('00000000-0000-0000-0000-000000000001', 'ticket_auto_reset', '"daily"', 'Reset ticket numbers daily'),
('00000000-0000-0000-0000-000000000001', 'max_wait_time_alert', '1800', 'Alert when wait time exceeds 30 minutes'),
('00000000-0000-0000-0000-000000000001', 'enable_sms', 'false', 'Enable SMS notifications'),
('00000000-0000-0000-0000-000000000001', 'enable_tts', 'true', 'Enable text-to-speech announcements'),
('00000000-0000-0000-0000-000000000001', 'display_language', '"en"', 'Default display language');

-- Insert sample announcement
INSERT INTO announcements (branch_id, title, message, type, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Welcome', 'Welcome to NAGA Queue Management System', 'info', true);