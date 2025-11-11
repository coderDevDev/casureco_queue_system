-- =====================================================
-- AUTHENTICATION TRIGGERS
-- =====================================================

-- Automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, branch_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'),
    (NEW.raw_user_meta_data->>'branch_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- AUDIT LOGGING TRIGGERS
-- =====================================================

-- Generic audit log function
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_branch_id UUID;
BEGIN
  -- Get current user info
  SELECT id, role, branch_id INTO v_user_id, v_user_role, v_branch_id
  FROM users WHERE id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    actor_id,
    actor_role,
    branch_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    v_user_id,
    v_user_role,
    v_branch_id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_tickets_changes
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_counters_changes
  AFTER INSERT OR UPDATE OR DELETE ON counters
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_services_changes
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- =====================================================
-- COUNTER HEARTBEAT FUNCTION
-- =====================================================

-- Update counter last_ping timestamp
CREATE OR REPLACE FUNCTION public.update_counter_heartbeat(p_counter_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE counters
  SET last_ping = NOW()
  WHERE id = p_counter_id
    AND staff_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION handle_new_user IS 'Automatically creates user profile when auth user signs up';
COMMENT ON FUNCTION audit_log_changes IS 'Logs all changes to audited tables';
COMMENT ON FUNCTION update_counter_heartbeat IS 'Updates counter heartbeat for active monitoring';