// lib/notifications/NotificationService.js
// JavaScript version for Next.js

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import twilio from 'twilio';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
// async function sendEmail( ) {
//   const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
//};

// Configure web push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
//process.env.VAPID_PUBLIC_KEY,
);

// Notification types enum
export const NotificationType = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_released',
  MESSAGE_RECEIVED: 'message_received',
  JOB_APPLICATION_RECEIVED: 'job_application_received',
  JOB_APPLICATION_SHORTLISTED: 'job_application_shortlisted',
  AUDITION_SCHEDULED: 'audition_scheduled',
  RATING_RECEIVED: 'rating_received',
  EVENT_REMINDER: 'event_reminder',
  PROPOSAL_RECEIVED: 'proposal_received',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
};

export class NotificationService {
  
  /**
   * Main entry point - send notification via all enabled channels
   * @param {Object} payload - Notification data
   * @param {string} payload.userId - Recipient user ID
   * @param {string} payload.type - Notification type from NotificationType
   * @param {string} payload.title - Notification title
   * @param {string} payload.body - Notification body text
   * @param {Object} [payload.data] - Additional data
   * @param {string} [payload.priority] - urgent | high | normal | low
   * @param {string} [payload.relatedEntityType] - Related entity type
   * @param {string} [payload.relatedEntityId] - Related entity ID
   * @param {string} [payload.actionUrl] - Action URL to navigate to
   */
  static async send(payload) {
    try {
      // 1. Get user preferences
      const prefs = await this.getUserPreferences(payload.userId);
      
      // 2. Check quiet hours
      if (this.isQuietHours(prefs)) {
        console.log('Quiet hours active, skipping notification');
        return;
      }
      
      // 3. Get channel preferences for this notification type
      const channels = this.getEnabledChannels(payload.type, prefs);
      
      // 4. Send via each enabled channel
      const promises = [];
      
      if (channels.email) {
        promises.push(this.sendEmail(payload, prefs));
      }
      
      if (channels.sms) {
        promises.push(this.sendSMS(payload, prefs));
      }
      
      if (channels.whatsapp) {
        promises.push(this.sendWhatsApp(payload, prefs));
      }
      
      if (channels.push) {
        promises.push(this.sendPush(payload, prefs));
      }
      
      // Always create in-app notification
      promises.push(this.createInAppNotification(payload));
      
      await Promise.allSettled(promises);
      
    } catch (error) {
      console.error('Notification send error:', error);
      // Log but don't throw - notifications shouldn't break main flow
    }
  }
  
  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      // Return default preferences
      return {
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        push_enabled: true,
        booking_notifications: { email: true, push: true },
        message_notifications: { push: true },
        payment_notifications: { email: true, sms: true, push: true },
        job_notifications: { email: true, push: true },
      };
    }
    
    return data;
  }
  
  /**
   * Check if current time is in user's quiet hours
   */
  static isQuietHours(prefs) {
    if (!prefs.quiet_hours_enabled) return false;
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: 'Africa/Lagos' 
    });
    
    const start = prefs.quiet_hours_start;
    const end = prefs.quiet_hours_end;
    
    if (start && end) {
      if (start < end) {
        return currentTime >= start && currentTime < end;
      } else {
        // Handles overnight quiet hours (e.g., 22:00 - 08:00)
        return currentTime >= start || currentTime < end;
      }
    }
    
    return false;
  }
  
  /**
   * Determine which channels are enabled for this notification type
   */
  static getEnabledChannels(type, prefs) {
    let typePrefs = {};
    
    // Map notification type to preference category
    if (type.includes('booking') || type.includes('proposal')) {
      typePrefs = prefs.booking_notifications || {};
    } else if (type.includes('message')) {
      typePrefs = prefs.message_notifications || {};
    } else if (type.includes('payment')) {
      typePrefs = prefs.payment_notifications || {};
    } else if (type.includes('job') || type.includes('audition')) {
      typePrefs = prefs.job_notifications || {};
    }
    
    return {
      email: prefs.email_enabled && (typePrefs.email ?? true),
      sms: prefs.sms_enabled && (typePrefs.sms ?? false),
      whatsapp: prefs.whatsapp_enabled && (typePrefs.whatsapp ?? false),
      push: prefs.push_enabled && (typePrefs.push ?? true),
    };
  }
  
  /**
   * Send email notification
   */
  static async sendEmail(payload, prefs) {
    try {
      const email = prefs.email_address || prefs.user_email;
      
      if (!email) {
        console.warn('No email address found for user');
        return;
      }
      
      const { data, error } = await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        to: email,
        subject: payload.title,
        html: this.getEmailTemplate(payload),
      });
      
      // Log notification
      await this.logNotification({
        userId: payload.userId,
        channel: 'email',
        status: error ? 'failed' : 'sent',
        provider: 'resend',
        providerMessageId: data?.id,
        errorMessage: error?.message,
        ...payload,
      });
      
    } catch (error) {
      console.error('Email send error:', error);
      await this.logNotification({
        userId: payload.userId,
        channel: 'email',
        status: 'failed',
        errorMessage: error.message,
        ...payload,
      });
    }
  }
  
  /**
   * Send SMS notification
   */
  static async sendSMS(payload, prefs) {
    try {
      const phone = prefs.phone_number;
      
      if (!phone) {
        console.warn('No phone number found for user');
        return;
      }
      
      const message = await twilioClient.messages.create({
        body: `${payload.title}\n\n${payload.body}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      
      await this.logNotification({
        userId: payload.userId,
        channel: 'sms',
        status: 'sent',
        provider: 'twilio',
        providerMessageId: message.sid,
        ...payload,
      });
      
    } catch (error) {
      console.error('SMS send error:', error);
      await this.logNotification({
        userId: payload.userId,
        channel: 'sms',
        status: 'failed',
        errorMessage: error.message,
        ...payload,
      });
    }
  }
  
  /**
   * Send WhatsApp notification
   */
  static async sendWhatsApp(payload, prefs) {
    try {
      const whatsapp = prefs.whatsapp_number || prefs.phone_number;
      
      if (!whatsapp) {
        console.warn('No WhatsApp number found for user');
        return;
      }
      
      const message = await twilioClient.messages.create({
        body: `*${payload.title}*\n\n${payload.body}`,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${whatsapp}`,
      });
      
      await this.logNotification({
        userId: payload.userId,
        channel: 'whatsapp',
        status: 'sent',
        provider: 'twilio',
        providerMessageId: message.sid,
        ...payload,
      });
      
    } catch (error) {
      console.error('WhatsApp send error:', error);
      await this.logNotification({
        userId: payload.userId,
        channel: 'whatsapp',
        status: 'failed',
        errorMessage: error.message,
        ...payload,
      });
    }
  }
  
  /**
   * Send push notification
   */
  static async sendPush(payload, prefs) {
    try {
      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', payload.userId);
      
      if (!subscriptions || subscriptions.length === 0) {
        console.warn('No push subscriptions found for user');
        return;
      }
      
      // Send to all devices
      const promises = subscriptions.map(sub => 
        webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              url: payload.actionUrl || '/notifications',
              ...payload.data,
            },
          })
        )
      );
      
      await Promise.allSettled(promises);
      
      await this.logNotification({
        userId: payload.userId,
        channel: 'push',
        status: 'sent',
        provider: 'web-push',
        ...payload,
      });
      
    } catch (error) {
      console.error('Push send error:', error);
      await this.logNotification({
        userId: payload.userId,
        channel: 'push',
        status: 'failed',
        errorMessage: error.message,
        ...payload,
      });
    }
  }
  
  /**
   * Create in-app notification
   */
  static async createInAppNotification(payload) {
    try {
      await supabase.from('in_app_notifications').insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.body,
        notification_type: payload.type,
        action_url: payload.actionUrl,
        related_entity_type: payload.relatedEntityType,
        related_entity_id: payload.relatedEntityId,
        priority: payload.priority || 'normal',
        icon: this.getIconForType(payload.type),
      });
      
    } catch (error) {
      console.error('In-app notification error:', error);
    }
  }
  
  /**
   * Log notification to database
   */
  static async logNotification(data) {
    try {
      await supabase.from('notification_log').insert({
        user_id: data.userId,
        notification_type: data.type,
        channel: data.channel,
        priority: data.priority || 'normal',
        title: data.title,
        body: data.body,
        data: data.data,
        status: data.status,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
        failed_at: data.status === 'failed' ? new Date().toISOString() : null,
        error_message: data.errorMessage,
        provider: data.provider,
        provider_message_id: data.providerMessageId,
        related_entity_type: data.relatedEntityType,
        related_entity_id: data.relatedEntityId,
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }
  
  /**
   * Get email HTML template
   */
  static getEmailTemplate(payload) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #7C3AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 ${payload.title}</h1>
          </div>
          <div class="content">
            <p>${payload.body}</p>
            ${payload.actionUrl ? `<a href="${payload.actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>AmplyGigs - Amplifying Musicians, Empowering Events</p>
            <p><a href="https://amplygigs.com/preferences">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get icon for notification type
   */
  static getIconForType(type) {
    const iconMap = {
      [NotificationType.BOOKING_CREATED]: '📅',
      [NotificationType.BOOKING_CONFIRMED]: '✅',
      [NotificationType.BOOKING_CANCELLED]: '❌',
      [NotificationType.PAYMENT_RECEIVED]: '💰',
      [NotificationType.PAYMENT_RELEASED]: '💸',
      [NotificationType.MESSAGE_RECEIVED]: '💬',
      [NotificationType.JOB_APPLICATION_RECEIVED]: '📋',
      [NotificationType.JOB_APPLICATION_SHORTLISTED]: '⭐',
      [NotificationType.AUDITION_SCHEDULED]: '🎤',
      [NotificationType.RATING_RECEIVED]: '⭐',
      [NotificationType.EVENT_REMINDER]: '⏰',
      [NotificationType.PROPOSAL_RECEIVED]: '📨',
      [NotificationType.PROPOSAL_ACCEPTED]: '🎉',
    };
    
    return iconMap[type] || '🔔';
  }
}