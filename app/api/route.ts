import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTicket, getTickets } from '@/lib/services/queue-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's branch
    const { data: profile } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const serviceId = searchParams.get('service_id') || undefined;
    const counterId = searchParams.get('counter_id') || undefined;

    const tickets = await getTickets(profile.branch_id, {
      status,
      serviceId,
      counterId,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error in GET /api/tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service_id, branch_id, priority_level, customer_name, customer_phone, notes } =
      body;

    if (!service_id || !branch_id) {
      return NextResponse.json(
        { error: 'service_id and branch_id are required' },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      service_id,
      branch_id,
      priority_level,
      customer_name,
      customer_phone,
      notes,
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}