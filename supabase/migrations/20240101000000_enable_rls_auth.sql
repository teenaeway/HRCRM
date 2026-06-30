-- Create Admin table
CREATE TABLE IF NOT EXISTS public."Admin" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "displayId" text UNIQUE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create Employee table
CREATE TABLE IF NOT EXISTS public."Employee" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "displayId" text UNIQUE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    phone text,
    address text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create Client table
CREATE TABLE IF NOT EXISTS public."Client" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "displayId" text UNIQUE,
    name text NOT NULL,
    "recruitmentPositionRequired" text,
    "contactName" text,
    email text,
    phone text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "employeeId" uuid REFERENCES public."Employee"(id) ON DELETE SET NULL,
    "companyType" text,
    website text,
    "companyAddress" text,
    state text,
    city text,
    "industryType" text
);

-- Create Candidate table
CREATE TABLE IF NOT EXISTS public."Candidate" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "displayId" text UNIQUE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    skills text,
    experience text,
    "jobTitle" text,
    "applicationDate" timestamp with time zone,
    linkedin text,
    portfolio text,
    education text,
    location text,
    "resumeUrl" text,
    "photoUrl" text,
    status text NOT NULL DEFAULT 'Registered'::text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "selectedById" uuid REFERENCES public."Employee"(id) ON DELETE SET NULL
);

-- Create CandidateDocument table
CREATE TABLE IF NOT EXISTS public."CandidateDocument" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    "fileUrl" text NOT NULL,
    "documentType" text NOT NULL,
    "uploadedAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "candidateId" uuid NOT NULL REFERENCES public."Candidate"(id) ON DELETE CASCADE
);

-- Create ActivityLog table
CREATE TABLE IF NOT EXISTS public."ActivityLog" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    details text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "employeeId" uuid NOT NULL REFERENCES public."Employee"(id) ON DELETE CASCADE,
    "candidateId" uuid REFERENCES public."Candidate"(id) ON DELETE SET NULL
);

-- Create Notice table
CREATE TABLE IF NOT EXISTS public."Notice" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "adminId" uuid NOT NULL REFERENCES public."Admin"(id) ON DELETE CASCADE
);

-- 1. Enable RLS on all tables
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;

-- 2. Basic Policies (to be refined based on roles later)
-- For now, allow authenticated users full access to migrate off the backend easily
CREATE POLICY "Allow authenticated users full access to Admin" ON "Admin" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to Employee" ON "Employee" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to Candidate" ON "Candidate" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to Client" ON "Client" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to CandidateDocument" ON "CandidateDocument" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to ActivityLog" ON "ActivityLog" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to Notice" ON "Notice" FOR ALL USING (auth.role() = 'authenticated');

-- 3. Trigger for new user signups
-- When a new user signs up via Supabase Auth, we want to create a corresponding record in the appropriate table
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public."Admin" (id, email, name, password)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'supa-auth');
  ELSIF NEW.raw_user_meta_data->>'role' = 'employee' THEN
    INSERT INTO public."Employee" (id, email, name, password)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'supa-auth');
  ELSE
    -- Default candidate role or others can be added here
    INSERT INTO public."Candidate" (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
