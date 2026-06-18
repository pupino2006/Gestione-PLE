-- Migration: app libera senza autenticazione
-- Esegui nel SQL Editor di Supabase: https://supabase.com/dashboard/project/fhijxhjsxkwtufzcuxuc/sql/new

-- Rimuove vincoli e colonna user_id (eredità del vecchio sistema login)
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_user_id_fkey;

ALTER TABLE public.checklists
  DROP CONSTRAINT IF EXISTS checklists_user_id_fkey;

ALTER TABLE public.contracts
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.checklists
  DROP COLUMN IF EXISTS user_id;

-- Policy RLS permissive per accesso anonimo
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contracts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contracts', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_contracts" ON public.contracts
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_contracts" ON public.contracts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_contracts" ON public.contracts
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'checklists'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.checklists', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_checklists" ON public.checklists
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_checklists" ON public.checklists
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_checklists" ON public.checklists
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Storage bucket ple-photos
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "anon_select_ple_photos" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'ple-photos');

CREATE POLICY "anon_insert_ple_photos" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'ple-photos');

CREATE POLICY "anon_update_ple_photos" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'ple-photos')
  WITH CHECK (bucket_id = 'ple-photos');
