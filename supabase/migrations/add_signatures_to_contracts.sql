-- Migration: Aggiunge tutte le colonne necessarie alla tabella contracts
-- Esegui questo script nel SQL Editor di Supabase

-- Aggiungi colonna ple_model se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS ple_model TEXT;

-- Aggiungi colonna company se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS company TEXT;

-- Aggiungi colonna address se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Aggiungi colonna fiscal_code se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS fiscal_code TEXT;

-- Aggiungi colonna start_date se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Aggiungi colonna end_date se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Aggiungi colonna notes se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Aggiungi colonna status se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'attivo';

-- Aggiungi colonne per le firme
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS comodante_signature TEXT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS comodatario_signature TEXT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signature_date TIMESTAMPTZ;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS return_signature TEXT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ;

-- Aggiungi colonna user_id se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Aggiungi colonna created_at se non esiste
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Verifica la struttura della tabella
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
