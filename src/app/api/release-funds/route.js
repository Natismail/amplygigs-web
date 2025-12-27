//src/app/api/release-funds/route.js:


import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    /* 1️⃣ Get booking */
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        musician_id,
        payment_status,
        funds_released_at,
        escrow_amount,
        event_date
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    /* 2️⃣ Auth ownership check (server-side trust) */
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // NOTE: In production, use @supabase/auth-helpers-nextjs
    // This simplified check assumes booking.client_id is trusted

    /* 3️⃣ Guards */
    if (booking.payment_status !== 'paid') {
      return Response.json(
        { error: 'Booking not paid' },
        { status: 400 }
      );
    }

    if (booking.funds_released_at) {
      return Response.json(
        { success: true, message: 'Funds already released' },
        { status: 200 }
      );
    }

    if (new Date(booking.event_date) > new Date()) {
      return Response.json(
        { error: 'Event not completed yet' },
        { status: 400 }
      );
    }

    /* 4️⃣ Release escrow atomically */
    const { error: rpcError } = await supabase.rpc(
      'release_escrow_funds',
      { p_booking_id: booking.id }
    );

    if (rpcError) {
      console.error(rpcError);
      return Response.json(
        { error: 'Failed to release funds' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Funds released successfully'
    });

  } catch (err) {
    console.error('Release funds error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


