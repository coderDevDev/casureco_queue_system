-- =====================================================
-- FIX: Allow ticket numbers to repeat on different days
-- =====================================================
-- Problem: Current constraint prevents C-002 from appearing 
--          on Day 2 if it existed on Day 1
-- Solution: Change constraint to allow same ticket number 
--           on different days

-- Step 1: Drop the old constraint
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_ticket_number_branch_id_key;

-- Step 2: Drop the old index if it exists
DROP INDEX IF EXISTS idx_tickets_unique_number_branch_date;

-- Step 3: Add a generated column for the date (stored as DATE type)
-- This is immutable and can be used in a unique index
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS created_date DATE 
GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED;

-- Step 4: Create a unique index using the new date column
-- This allows C-002 on 2025-11-18 AND C-002 on 2025-11-19
-- But prevents two C-002 tickets on the same day
CREATE UNIQUE INDEX idx_tickets_unique_number_branch_date 
    ON tickets (ticket_number, branch_id, created_date);

-- Step 5: Add comment to explain the index
COMMENT ON INDEX idx_tickets_unique_number_branch_date IS 
    'Ensures ticket numbers are unique per branch per day, allowing daily reset of ticket sequences';

-- Step 6: Add comment to explain the new column
COMMENT ON COLUMN tickets.created_date IS 
    'Date portion of created_at, used for daily ticket number uniqueness';