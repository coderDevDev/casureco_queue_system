-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Get current user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch()
RETURNS UUID AS $$
  SELECT branch_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is admin or supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- BRANCHES TABLE POLICIES
-- =====================================================

-- Admin can do everything
CREATE POLICY "Admin full access to branches"
  ON branches FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Others can view their own branch
CREATE POLICY "Users can view their branch"
  ON branches FOR SELECT
  TO authenticated
  USING (id = public.get_user_branch());

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin can manage all users
CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Supervisor can view users in their branch
CREATE POLICY "Supervisor can view branch users"
  ON users FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'supervisor' 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- SERVICES TABLE POLICIES
-- =====================================================

-- Everyone can view active services in their branch
CREATE POLICY "View services in branch"
  ON services FOR SELECT
  TO authenticated
  USING (
    branch_id = public.get_user_branch() 
    AND is_active = true
  );

-- Admin and supervisor can manage services
CREATE POLICY "Admin/Supervisor can manage services"
  ON services FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_supervisor() 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- COUNTERS TABLE POLICIES
-- =====================================================

-- Everyone can view counters in their branch
CREATE POLICY "View counters in branch"
  ON counters FOR SELECT
  TO authenticated
  USING (branch_id = public.get_user_branch());

-- Staff can update their assigned counter
CREATE POLICY "Staff can update assigned counter"
  ON counters FOR UPDATE
  TO authenticated
  USING (
    staff_id = auth.uid() 
    AND branch_id = public.get_user_branch()
  )
  WITH CHECK (
    staff_id = auth.uid() 
    AND branch_id = public.get_user_branch()
  );

-- Admin and supervisor can manage counters
CREATE POLICY "Admin/Supervisor can manage counters"
  ON counters FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_supervisor() 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- TICKETS TABLE POLICIES
-- =====================================================

-- Everyone can view tickets in their branch
CREATE POLICY "View tickets in branch"
  ON tickets FOR SELECT
  TO authenticated
  USING (branch_id = public.get_user_branch());

-- Kiosk role can insert tickets
CREATE POLICY "Kiosk can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'kiosk' 
    AND branch_id = public.get_user_branch()
  );

-- Staff can update tickets at their counter
CREATE POLICY "Staff can update counter tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('staff', 'supervisor', 'admin')
    AND branch_id = public.get_user_branch()
    AND (
      counter_id IN (
        SELECT id FROM counters WHERE staff_id = auth.uid()
      )
      OR public.is_admin_or_supervisor()
    )
  )
  WITH CHECK (
    branch_id = public.get_user_branch()
  );

-- Admin and supervisor can delete tickets
CREATE POLICY "Admin/Supervisor can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    public.is_admin_or_supervisor() 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- TICKET_SEQUENCES TABLE POLICIES
-- =====================================================

-- System managed - only functions can modify
CREATE POLICY "View sequences in branch"
  ON ticket_sequences FOR SELECT
  TO authenticated
  USING (branch_id = public.get_user_branch());

-- Admin can manage sequences
CREATE POLICY "Admin can manage sequences"
  ON ticket_sequences FOR ALL
  TO authenticated
  USING (
    public.get_user_role() = 'admin' 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Admin and supervisor can view audit logs
CREATE POLICY "Admin/Supervisor can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_supervisor() 
    AND branch_id = public.get_user_branch()
  );

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (branch_id = public.get_user_branch());

-- =====================================================
-- SYSTEM_SETTINGS TABLE POLICIES
-- =====================================================

-- Everyone can view settings
CREATE POLICY "View settings in branch"
  ON system_settings FOR SELECT
  TO authenticated
  USING (branch_id = public.get_user_branch());

-- Admin can manage settings
CREATE POLICY "Admin can manage settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    public.get_user_role() = 'admin' 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- =====================================================

-- Everyone can view active announcements
CREATE POLICY "View active announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    branch_id = public.get_user_branch() 
    AND is_active = true
  );

-- Admin and supervisor can manage announcements
CREATE POLICY "Admin/Supervisor can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_supervisor() 
    AND branch_id = public.get_user_branch()
  );

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE counters;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Admin full access to branches" ON branches IS 'Admins have full access to all branches';
COMMENT ON POLICY "Kiosk can create tickets" ON tickets IS 'Kiosk terminals can only create tickets';
COMMENT ON POLICY "Staff can update counter tickets" ON tickets IS 'Staff can only update tickets at their assigned counter';