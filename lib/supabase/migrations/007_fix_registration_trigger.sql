-- =====================================================
-- FIX USER REGISTRATION TRIGGER
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get branch_id from metadata or use default
  v_branch_id := COALESCE(
    (NEW.raw_user_meta_data->>'branch_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
  );

  -- Insert user profile
  INSERT INTO public.users (id, name, email, role, branch_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'::user_role),
    v_branch_id,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also add policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Comment
COMMENT ON FUNCTION handle_new_user IS 'Automatically creates user profile when auth user signs up - with error handling';
COMMENT ON POLICY "Users can create own profile" ON users IS 'Allows users to create their own profile during registration';