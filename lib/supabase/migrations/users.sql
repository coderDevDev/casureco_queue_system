
-- Step 2: Create auth users with encrypted passwords
-- Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Staff User 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff1@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Staff User 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff2@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Step 3: Create identities for each user
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  id::text,
  format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', id, email)::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users 
WHERE email IN ('admin@gmail.com', 'staff1@gmail.com', 'staff2@gmail.com');

-- Step 4: Create public.users profiles
-- Admin
INSERT INTO public.users (id, email, name, role, branch_id, is_active)
SELECT 
  id,
  'admin@gmail.com',
  'Admin User',
  'admin'::user_role,
  '00000000-0000-0000-0000-000000000001'::uuid,
  true
FROM auth.users 
WHERE email = 'admin@gmail.com';

-- Staff 1
INSERT INTO public.users (id, email, name, role, branch_id, is_active)
SELECT 
  id,
  'staff1@gmail.com',
  'Staff User 1',
  'staff'::user_role,
  '00000000-0000-0000-0000-000000000001'::uuid,
  true
FROM auth.users 
WHERE email = 'staff1@gmail.com';

-- Staff 2
INSERT INTO public.users (id, email, name, role, branch_id, is_active)
SELECT 
  id,
  'staff2@gmail.com',
  'Staff User 2',
  'staff'::user_role,
  '00000000-0000-0000-0000-000000000001'::uuid,
  true
FROM auth.users 
WHERE email = 'staff2@gmail.com';

-- Step 5: Verify users were created
SELECT 
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  pu.name,
  pu.role,
  pu.is_active,
  CASE WHEN au.id = pu.id THEN '✅ Match' ELSE '❌ Mismatch' END as id_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('admin@gmail.com', 'staff1@gmail.com', 'staff2@gmail.com')
ORDER BY pu.role DESC, au.email;