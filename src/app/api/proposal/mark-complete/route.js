// src/app/api/proposal/mark-complete/route.js
// Marks a proposal as completed — callable by either musician or client
// Proposals don't have escrow, so this just updates status + sends notifications

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { proposalId, userId } = await req.json();

    if (!proposalId || !userId) {
      return Response.json({
        success: false,
        error: 'proposalId and userId are required'
      }, { status: 400 });
    }

    console.log('✅ Mark-complete proposal:', proposalId, 'by user:', userId);

    // 1. Get proposal with both parties
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        musician:musician_id(id, first_name, last_name, email),
        client:client_id(id, first_name, last_name, email)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('❌ Proposal not found:', proposalError);
      return Response.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    // 2. Verify caller is part of this proposal
    const isMusicianOnProposal = proposal.musician_id === userId;
    const isClientOnProposal = proposal.client_id === userId;

    if (!isMusicianOnProposal && !isClientOnProposal) {
      return Response.json({
        success: false,
        error: 'You are not authorized to mark this proposal as complete'
      }, { status: 403 });
    }

    // 3. Only accepted/confirmed proposals can be completed
    const allowedStatuses = ['accepted', 'confirmed'];
    if (!allowedStatuses.includes(proposal.status)) {
      return Response.json({
        success: false,
        error: `Cannot complete proposal with status "${proposal.status}". Must be accepted or confirmed first.`
      }, { status: 400 });
    }

    // 4. Update proposal to completed
    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Proposal update error:', updateError);

      // Constraint violation — 'completed' not in check constraint
      if (updateError.code === '23514') {
        return Response.json({
          success: false,
          error: 'Database constraint error. Run the SQL fix below to allow "completed" status.',
          sql_fix: `ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check 
CHECK (status IN ('pending', 'accepted', 'confirmed', 'completed', 'rejected', 'cancelled', 'expired'));`,
          details: updateError.message
        }, { status: 500 });
      }

      return Response.json({
        success: false,
        error: 'Failed to update proposal',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Proposal marked complete:', proposalId);

    // 5. Non-blocking notifications
    sendCompletionNotifications(proposal, isMusicianOnProposal).catch(err =>
      console.warn('⚠️ Notification error (non-critical):', err.message)
    );

    return Response.json({
      success: true,
      message: 'Proposal marked as complete',
      data: updatedProposal
    });

  } catch (error) {
    console.error('❌ Proposal mark-complete error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

async function sendCompletionNotifications(proposal, completedByMusician) {
  const musicianName = `${proposal.musician?.first_name || ''} ${proposal.musician?.last_name || ''}`.trim();
  const clientName = `${proposal.client?.first_name || ''} ${proposal.client?.last_name || ''}`.trim();
  const gigTitle = proposal.event_type || 'the gig';

  const target = completedByMusician
    ? {
        user_id: proposal.client_id,
        type: 'proposal_completed',
        title: '🎵 Proposal Marked Complete',
        message: `${musicianName} has marked the proposal for "${gigTitle}" as complete.`,
        data: { proposal_id: proposal.id, completed_by: 'musician' },
        read: false,
        is_read: false
      }
    : {
        user_id: proposal.musician_id,
        type: 'proposal_completed',
        title: '✅ Proposal Completed',
        message: `${clientName} has marked the proposal for "${gigTitle}" as complete. Great work!`,
        data: { proposal_id: proposal.id, completed_by: 'client' },
        read: false,
        is_read: false
      };

  await supabase.from('notifications').insert(target);
  console.log('✅ Proposal completion notification sent');
}