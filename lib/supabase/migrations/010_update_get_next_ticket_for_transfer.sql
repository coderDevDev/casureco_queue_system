-- =====================================================
-- MIGRATION 010: Update get_next_ticket for Transfer Support
-- =====================================================
-- Purpose: Prioritize transferred tickets when calling next

CREATE OR REPLACE FUNCTION get_next_ticket(
    p_service_id UUID,
    p_counter_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_ticket_id UUID;
BEGIN
    -- Select next waiting ticket with enhanced priority
    -- Priority order:
    -- 1. Emergency (priority_level = 2) transferred to this counter
    -- 2. Emergency (priority_level = 2) not transferred
    -- 3. Senior/PWD (priority_level = 1) transferred to this counter
    -- 4. Senior/PWD (priority_level = 1) not transferred
    -- 5. Normal (priority_level = 0) transferred to this counter
    -- 6. Normal (priority_level = 0) not transferred
    -- Within same priority: FIFO (first in, first out)
    
    SELECT id INTO v_ticket_id
    FROM tickets
    WHERE (p_service_id IS NULL OR service_id = p_service_id)
        AND status = 'waiting'
    ORDER BY 
        priority_level DESC,
        CASE 
            WHEN preferred_counter_id = p_counter_id THEN 0
            ELSE 1
        END,
        created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Prevent race conditions
    
    IF v_ticket_id IS NOT NULL THEN
        -- Update ticket status
        UPDATE tickets
        SET 
            status = 'serving',
            counter_id = p_counter_id,
            called_at = NOW(),
            started_at = NOW()
        WHERE id = v_ticket_id;
    END IF;
    
    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_ticket IS 'Get next ticket in queue with priority and transfer handling';