// app/api/bookings/confirm/route.js
// JavaScript version for Next.js API Route

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from '@/lib/notifications/NotificationService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { bookingId, userId } = await request.json();
    
    // 1. Get booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        event:events(*),
        musician:user_profiles!musician_id(
          id,
          display_name,
          first_name,
          last_name,
          email
        ),
        client:user_profiles!client_id(
          id,
          display_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' }, 
        { status: 404 }
      );
    }
    
    // 2. Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (updateError) {
      throw updateError;
    }
    
    // 3. Send notification to MUSICIAN
    await NotificationService.send({
      userId: booking.musician_id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: '🎉 Booking Confirmed!',
      body: `Great news! Your booking for "${booking.event.title}" on ${new Date(booking.event.event_date).toLocaleDateString('en-NG', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} has been confirmed. Payment of ₦${booking.amount.toLocaleString()} is secured in escrow.`,
      priority: 'high',
      relatedEntityType: 'booking',
      relatedEntityId: booking.id,
      actionUrl: `/musician/bookings/${booking.id}`,
      data: {
        eventTitle: booking.event.title,
        eventDate: booking.event.event_date,
        amount: booking.amount,
        clientName: booking.client?.display_name || `${booking.client?.first_name} ${booking.client?.last_name}`,
        venue: booking.event.venue,
        city: booking.event.city,
      }
    });
    
    // 4. Send notification to CLIENT
    await NotificationService.send({
      userId: booking.client_id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: '✅ Booking Confirmed',
      body: `Your booking with ${booking.musician?.display_name || booking.musician?.first_name} for "${booking.event.title}" is confirmed. They will arrive at ${booking.event.venue} on ${new Date(booking.event.event_date).toLocaleDateString('en-NG')}.`,
      priority: 'normal',
      relatedEntityType: 'booking',
      relatedEntityId: booking.id,
      actionUrl: `/client/bookings/${booking.id}`,
      data: {
        musicianName: booking.musician?.display_name || `${booking.musician?.first_name} ${booking.musician?.last_name}`,
        eventTitle: booking.event.title,
        eventDate: booking.event.event_date,
        venue: booking.event.venue,
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Booking confirmed and notifications sent',
      booking: {
        id: booking.id,
        status: 'confirmed',
        confirmed_at: booking.confirmed_at
      }
    });
    
  } catch (error) {
    console.error('Booking confirmation error:', error);
    return NextResponse.json({ 
      error: 'Failed to confirm booking',
      details: error.message 
    }, { status: 500 });
  }
}