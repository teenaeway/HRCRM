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
