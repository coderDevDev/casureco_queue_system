-- =====================================================
-- MIGRATION 009: Add Ticket Transfer Functionality
-- =====================================================
-- Purpose: Allow staff to transfer waiting tickets between counters
-- for workload balancing and flexibility

-- Add transfer-related columns to tickets table
ALTER TABLE tickets
ADD COLUMN preferred_counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
ADD COLUMN transfer_reason TEXT,
ADD COLUMN transferred_from_counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
ADD COLUMN transferred_at TIMESTAMPTZ,
ADD COLUMN transferred_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance on preferred counter lookups
CREATE INDEX idx_tickets_preferred_counter 
ON tickets(preferred_counter_id) 
WHERE status = 'waiting' AND preferred_counter_id IS NOT NULL;

-- Add index for transfer history queries
CREATE INDEX idx_tickets_transferred_at 
ON tickets(transferred_at DESC) 
WHERE transferred_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tickets.preferred_counter_id IS 'Target counter for transferred tickets (NULL = no preference)';
COMMENT ON COLUMN tickets.transfer_reason IS 'Reason for transfer (e.g., workload balancing, counter issue)';
COMMENT ON COLUMN tickets.transferred_from_counter_id IS 'Original counter before transfer (for audit trail)';
COMMENT ON COLUMN tickets.transferred_at IS 'Timestamp when ticket was transferred';
COMMENT ON COLUMN tickets.transferred_by IS 'Staff member who initiated the transfer';