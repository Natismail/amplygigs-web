// src/lib/notificationService.js - COMPREHENSIVE VERSION
import { supabase } from './supabaseClient';

class NotificationService {
  /**
   * Generic notification creator
   */
  async createNotification({ 
    userId, 
    type, 
    title, 
    message, 
    data = null 
  }) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Notification created:', notification);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // ============================================
  // BOOKING NOTIFICATIONS
  // ============================================

  async notifyNewBooking({ musicianId, clientName, eventDate, bookingId, amount }) {
    return this.createNotification({
      userId: musicianId,
      type: 'booking',
      title: 'New Booking Request',
      message: `${clientName} requested to book you for ${new Date(eventDate).toLocaleDateString()}`,
      data: {
        booking_id: bookingId,
        event_date: eventDate,
        amount: amount,
      },
    });
  }

  async notifyBookingConfirmed({ clientId, musicianName, eventDate, bookingId }) {
    return this.createNotification({
      userId: clientId,
      type: 'booking',
      title: 'Booking Confirmed ✅',
      message: `${musicianName} confirmed your booking for ${new Date(eventDate).toLocaleDateString()}`,
      data: { booking_id: bookingId },
    });
  }

  async notifyBookingCancelled({ userId, cancelledBy, bookingId, reason = null }) {
    return this.createNotification({
      userId,
      type: 'booking',
      title: 'Booking Cancelled',
      message: reason ? `Booking cancelled: ${reason}` : `${cancelledBy} cancelled the booking`,
      data: { booking_id: bookingId, reason },
    });
  }

  async notifyBookingCompleted({ clientId, musicianName, bookingId }) {
    return this.createNotification({
      userId: clientId,
      type: 'booking',
      title: 'Booking Completed ✨',
      message: `Your booking with ${musicianName} is complete`,
      data: { booking_id: bookingId },
    });
  }

  // ============================================
  // PROPOSAL NOTIFICATIONS
  // ============================================

  async notifyNewProposal({ musicianId, clientName, eventDate, proposalId, amount }) {
    return this.createNotification({
      userId: musicianId,
      type: 'proposal',
      title: 'New Proposal',
      message: `${clientName} sent you a booking proposal for ${new Date(eventDate).toLocaleDateString()}`,
      data: {
        proposal_id: proposalId,
        event_date: eventDate,
        amount: amount,
      },
    });
  }

  async notifyProposalAccepted({ clientId, musicianName, proposalId }) {
    return this.createNotification({
      userId: clientId,
      type: 'proposal',
      title: 'Proposal Accepted! 🎉',
      message: `${musicianName} accepted your proposal`,
      data: { proposal_id: proposalId },
    });
  }

  async notifyProposalDeclined({ clientId, musicianName, proposalId, reason = null }) {
    return this.createNotification({
      userId: clientId,
      type: 'proposal',
      title: 'Proposal Declined',
      message: reason ? `${musicianName} declined: ${reason}` : `${musicianName} declined your proposal`,
      data: { proposal_id: proposalId, reason },
    });
  }

  // ============================================
  // MESSAGE NOTIFICATIONS (fallback if trigger fails)
  // ============================================

  async notifyNewMessage({ receiverId, senderName, senderId, conversationId }) {
    return this.createNotification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      data: {
        sender_id: senderId,
        sender_name: senderName,
        conversation_id: conversationId,
      },
    });
  }

  // ============================================
  // VERIFICATION NOTIFICATIONS
  // ============================================

  async notifyVerificationApproved({ userId }) {
    return this.createNotification({
      userId,
      type: 'verification',
      title: 'Verification Approved ✅',
      message: 'Congratulations! Your profile has been verified. You can now receive bookings.',
      data: { verification_status: 'approved' },
    });
  }

  async notifyVerificationRejected({ userId, reason }) {
    return this.createNotification({
      userId,
      type: 'verification',
      title: 'Verification Not Approved',
      message: `Your verification was not approved. Reason: ${reason}`,
      data: { verification_status: 'rejected', reason },
    });
  }

  async notifyVerificationPending({ userId }) {
    return this.createNotification({
      userId,
      type: 'verification',
      title: 'Verification Under Review',
      message: 'Your verification documents are being reviewed. We\'ll notify you once complete.',
      data: { verification_status: 'pending' },
    });
  }

  // ============================================
  // PAYMENT NOTIFICATIONS
  // ============================================

  async notifyPaymentReceived({ musicianId, amount, clientName, bookingId }) {
    return this.createNotification({
      userId: musicianId,
      type: 'payment',
      title: 'Payment Received 💰',
      message: `You received ₦${amount.toLocaleString()} from ${clientName}`,
      data: {
        booking_id: bookingId,
        amount: amount,
      },
    });
  }

  async notifyPaymentPending({ clientId, amount, bookingId }) {
    return this.createNotification({
      userId: clientId,
      type: 'payment',
      title: 'Payment Processing',
      message: `Your payment of ₦${amount.toLocaleString()} is being processed`,
      data: { booking_id: bookingId, amount },
    });
  }

  // ============================================
  // LOCATION/TRACKING NOTIFICATIONS
  // ============================================

  async notifyTrackingStarted({ clientId, musicianName, bookingId }) {
    return this.createNotification({
      userId: clientId,
      type: 'tracking',
      title: 'Musician On The Way 🚗',
      message: `${musicianName} started heading to your event location`,
      data: { booking_id: bookingId },
    });
  }

  async notifyMusicianArrived({ clientId, musicianName, bookingId }) {
    return this.createNotification({
      userId: clientId,
      type: 'tracking',
      title: 'Musician Arrived! 🎵',
      message: `${musicianName} has arrived at the event location`,
      data: { booking_id: bookingId },
    });
  }

  // ============================================
  // REVIEW/RATING NOTIFICATIONS
  // ============================================

  async notifyNewReview({ musicianId, clientName, rating, bookingId }) {
    return this.createNotification({
      userId: musicianId,
      type: 'review',
      title: 'New Review',
      message: `${clientName} left you a ${rating}-star review`,
      data: {
        booking_id: bookingId,
        rating: rating,
      },
    });
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, is_read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      console.log('✅ Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async cleanupOldNotifications(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      console.log(`✅ Cleaned up notifications older than ${daysOld} days`);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new NotificationService();