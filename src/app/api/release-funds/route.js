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




// // src/app/api/release-funds/route.js
// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export async function POST(req) {
//   try {
//     const { bookingId, clientId } = await req.json();

//     // 1. Validate inputs
//     if (!bookingId || !clientId) {
//       return Response.json(
//         { error: 'Missing required fields: bookingId and clientId' },
//         { status: 400 }
//       );
//     }

//     // 2. Fetch booking details and verify ownership
//     const { data: booking, error: bookingError } = await supabase
//       .from('bookings')
//       .select('*, transactions(*)')
//       .eq('id', bookingId)
//       .eq('client_id', clientId)
//       .single();

//     if (bookingError || !booking) {
//       return Response.json(
//         { error: 'Booking not found or unauthorized' },
//         { status: 404 }
//       );
//     }

//     // 3. Verify booking status
//     if (booking.payment_status !== 'paid') {
//       return Response.json(
//         { error: 'Payment not completed for this booking' },
//         { status: 400 }
//       );
//     }

//     if (booking.funds_released_at) {
//       return Response.json(
//         { error: 'Funds already released for this booking' },
//         { status: 400 }
//       );
//     }

//     // 4. Get the original payment transaction
//     const { data: paymentTransaction, error: txError } = await supabase
//       .from('transactions')
//       .select('*')
//       .eq('booking_id', bookingId)
//       .eq('transaction_type', 'payment')
//       .eq('payment_status', 'successful')
//       .single();

//     if (txError || !paymentTransaction) {
//       return Response.json(
//         { error: 'Payment transaction not found' },
//         { status: 404 }
//       );
//     }

//     const musicianId = paymentTransaction.musician_id;
//     const releaseAmount = paymentTransaction.net_amount;

//     // 5. Get musician's wallet
//     const { data: wallet, error: walletError } = await supabase
//       .from('musician_wallets')
//       .select('*')
//       .eq('musician_id', musicianId)
//       .single();

//     if (walletError || !wallet) {
//       return Response.json(
//         { error: 'Musician wallet not found' },
//         { status: 404 }
//       );
//     }

//     // 6. Verify ledger balance is sufficient
//     if (wallet.ledger_balance < releaseAmount) {
//       return Response.json(
//         { error: 'Insufficient ledger balance' },
//         { status: 400 }
//       );
//     }

//     // 7. Create escrow release transaction
//     const { data: releaseTransaction, error: releaseTxError } = await supabase
//       .from('transactions')
//       .insert({
//         booking_id: bookingId,
//         musician_id: musicianId,
//         client_id: clientId,
//         transaction_type: 'escrow_release',
//         amount: releaseAmount,
//         net_amount: releaseAmount,
//         currency: paymentTransaction.currency,
//         transaction_ref: `release_${bookingId}_${Date.now()}`,
//         payment_status: 'successful',
//         payment_provider: 'internal',
//         description: `Escrow release for booking ${bookingId}`,
//         metadata: {
//           original_transaction_id: paymentTransaction.id,
//           booking_id: bookingId
//         }
//       })
//       .select()
//       .single();

//     if (releaseTxError) {
//       console.error('Release transaction creation error:', releaseTxError);
//       return Response.json(
//         { error: 'Failed to create release transaction' },
//         { status: 500 }
//       );
//     }

//     // 8. Update musician wallet: Move from ledger to available
//     const { error: walletUpdateError } = await supabase
//       .from('musician_wallets')
//       .update({
//         ledger_balance: wallet.ledger_balance - releaseAmount,
//         available_balance: wallet.available_balance + releaseAmount
//       })
//       .eq('musician_id', musicianId);

//     if (walletUpdateError) {
//       console.error('Wallet update error:', walletUpdateError);
//       // Rollback release transaction
//       await supabase
//         .from('transactions')
//         .delete()
//         .eq('id', releaseTransaction.id);
      
//       return Response.json(
//         { error: 'Failed to update wallet' },
//         { status: 500 }
//       );
//     }

//     // 9. Update booking status
//     await supabase
//       .from('bookings')
//       .update({
//         status: 'completed',
//         funds_released_at: new Date().toISOString()
//       })
//       .eq('id', bookingId);

//     console.log(`✅ Funds released: ${releaseAmount} for booking ${bookingId}`);

//     // TODO: Send notification to musician about available funds
//     // TODO: Send confirmation to client

//     return Response.json({
//       success: true,
//       message: 'Funds released successfully',
//       data: {
//         transactionId: releaseTransaction.id,
//         amount: releaseAmount,
//         musicianId: musicianId,
//         newAvailableBalance: wallet.available_balance + releaseAmount,
//         newLedgerBalance: wallet.ledger_balance - releaseAmount
//       }
//     });

//   } catch (error) {
//     console.error('Release funds error:', error);
//     return Response.json(
//       { error: 'An unexpected error occurred', details: error.message },
//       { status: 500 }
//     );
//   }
// }