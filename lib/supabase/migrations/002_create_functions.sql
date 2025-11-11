-- =====================================================
-- FUNCTION: Get Next Ticket Number
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_ticket_number(
    p_service_id UUID,
    p_branch_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_sequence INTEGER;
    v_ticket_number TEXT;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get service prefix
    SELECT prefix INTO v_prefix
    FROM services
    WHERE id = p_service_id;
    
    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Service not found';
    END IF;
    
    -- Get or create sequence for today
    INSERT INTO ticket_sequences (service_id, branch_id, date, current_number)
    VALUES (p_service_id, p_branch_id, v_today, 1)
    ON CONFLICT (service_id, branch_id, date)
    DO UPDATE SET 
        current_number = ticket_sequences.current_number + 1,
        updated_at = NOW()
    RETURNING current_number INTO v_sequence;
    
    -- Format ticket number: PREFIX-XXX (e.g., A-001, B-042)
    v_ticket_number := v_prefix || '-' || LPAD(v_sequence::TEXT, 3, '0');
    
    RETURN v_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get Next Ticket in Queue
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_ticket(
    p_service_id UUID,
    p_counter_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_ticket_id UUID;
BEGIN
    -- Select next waiting ticket with priority
    -- Priority order: emergency (2) > senior/PWD (1) > normal (0)
    -- Within same priority: FIFO (first in, first out)
    SELECT id INTO v_ticket_id
    FROM tickets
    WHERE service_id = p_service_id
        AND status = 'waiting'
    ORDER BY priority_level DESC, created_at ASC
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

-- =====================================================
-- FUNCTION: Calculate Wait Time Estimate
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_wait_time(
    p_service_id UUID,
    p_branch_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_waiting_count INTEGER;
    v_avg_service_time INTEGER;
    v_active_counters INTEGER;
    v_estimated_wait INTEGER;
BEGIN
    -- Count waiting tickets
    SELECT COUNT(*) INTO v_waiting_count
    FROM tickets
    WHERE service_id = p_service_id
        AND branch_id = p_branch_id
        AND status = 'waiting';
    
    -- Get average service time
    SELECT avg_service_time INTO v_avg_service_time
    FROM services
    WHERE id = p_service_id;
    
    -- Count active counters
    SELECT COUNT(*) INTO v_active_counters
    FROM counters
    WHERE branch_id = p_branch_id
        AND is_active = true
        AND is_paused = false
        AND staff_id IS NOT NULL;
    
    -- Calculate estimate
    IF v_active_counters = 0 THEN
        v_active_counters := 1; -- Avoid division by zero
    END IF;
    
    v_estimated_wait := CEIL((v_waiting_count * v_avg_service_time)::NUMERIC / v_active_counters);
    
    RETURN v_estimated_wait;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get Queue Position
-- =====================================================
CREATE OR REPLACE FUNCTION get_queue_position(
    p_ticket_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_position INTEGER;
    v_service_id UUID;
    v_priority INTEGER;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- Get ticket details
    SELECT service_id, priority_level, created_at
    INTO v_service_id, v_priority, v_created_at
    FROM tickets
    WHERE id = p_ticket_id;
    
    IF v_service_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Count tickets ahead in queue
    SELECT COUNT(*) + 1 INTO v_position
    FROM tickets
    WHERE service_id = v_service_id
        AND status = 'waiting'
        AND (
            priority_level > v_priority
            OR (priority_level = v_priority AND created_at < v_created_at)
        );
    
    RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get Queue Statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_queue_stats(
    p_branch_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_tickets INTEGER,
    waiting_tickets INTEGER,
    serving_tickets INTEGER,
    completed_tickets INTEGER,
    avg_wait_time NUMERIC,
    avg_service_time NUMERIC,
    active_counters INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_tickets,
        COUNT(*) FILTER (WHERE status = 'waiting')::INTEGER AS waiting_tickets,
        COUNT(*) FILTER (WHERE status = 'serving')::INTEGER AS serving_tickets,
        COUNT(*) FILTER (WHERE status = 'done')::INTEGER AS completed_tickets,
        AVG(EXTRACT(EPOCH FROM (called_at - created_at))) FILTER (WHERE called_at IS NOT NULL) AS avg_wait_time,
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) FILTER (WHERE ended_at IS NOT NULL AND started_at IS NOT NULL) AS avg_service_time,
        (SELECT COUNT(*)::INTEGER FROM counters WHERE branch_id = p_branch_id AND is_active = true) AS active_counters
    FROM tickets
    WHERE branch_id = p_branch_id
        AND DATE(created_at) = p_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Reset Daily Sequences (run at midnight)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_daily_sequences()
RETURNS void AS $$
BEGIN
    -- Archive old sequences (optional)
    -- DELETE FROM ticket_sequences WHERE date < CURRENT_DATE - INTERVAL '30 days';
    
    -- Note: New sequences are auto-created by get_next_ticket_number function
    -- This function is here for future cleanup tasks
    
    RAISE NOTICE 'Daily sequence reset completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_next_ticket_number IS 'Generate next ticket number for a service';
COMMENT ON FUNCTION get_next_ticket IS 'Get next ticket in queue with priority handling';
COMMENT ON FUNCTION calculate_wait_time IS 'Calculate estimated wait time in seconds';
COMMENT ON FUNCTION get_queue_position IS 'Get position of ticket in queue';
COMMENT ON FUNCTION get_queue_stats IS 'Get queue statistics for a branch and date';