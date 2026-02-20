// src/app/admin/support-tickets/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SupportTickets() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const checkAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    fetchTickets();
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:user_id(first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'ALL') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setProcessing(true);
    try {
      await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'RESOLVED' ? new Date().toISOString() : null,
        })
        .eq('id', ticketId);

      const ticket = tickets.find(t => t.id === ticketId);

      // Log action
      await supabase.from('admin_actions').insert({
        action_type: 'ticket_status_change',
        target_user_id: ticket.user_id,
        target_type: 'ticket',
        target_id: ticketId,
        reason: `Status changed to ${newStatus}`,
      });

      // Notify user
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'ticket_update',
        title: 'Support Ticket Updated',
        message: `Your ticket #${ticketId.slice(0, 8)} status has been updated to ${newStatus}`,
      });

      alert('Ticket status updated');
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      alert('Update failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReply = async (ticketId) => {
    if (!reply.trim()) {
      alert('Please enter a reply');
      return;
    }

    setProcessing(true);
    try {
      const ticket = tickets.find(t => t.id === ticketId);

      // Add reply to ticket
      await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: reply,
          is_staff: true,
        });

      // Update ticket status to IN_PROGRESS if it was OPEN
      if (ticket.status === 'OPEN') {
        await supabase
          .from('support_tickets')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', ticketId);
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'ticket_reply',
        title: 'New Reply on Your Ticket',
        message: `Support team has replied to your ticket #${ticketId.slice(0, 8)}`,
      });

      setReply('');
      alert('Reply sent successfully');
      fetchTickets();
    } catch (error) {
      alert('Reply failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  const stats = {
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🎫 Support Tickets</h1>
          <p className="text-purple-100">Manage and respond to user support requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Open"
            value={stats.open}
            icon="📨"
            color="yellow"
            active={statusFilter === 'OPEN'}
            onClick={() => setStatusFilter('OPEN')}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon="🔄"
            color="blue"
            active={statusFilter === 'IN_PROGRESS'}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon="✅"
            color="green"
            active={statusFilter === 'RESOLVED'}
            onClick={() => setStatusFilter('RESOLVED')}
          />
          <StatCard
            label="Closed"
            value={stats.closed}
            icon="🔒"
            color="gray"
            active={statusFilter === 'CLOSED'}
            onClick={() => setStatusFilter('CLOSED')}
          />
        </div>

        {/* Priority Filter */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                priorityFilter === priority
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No tickets found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All clear! No {statusFilter.toLowerCase()} tickets.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div 
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {ticket.subject}
                      </h3>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <strong>From:</strong> {ticket.user?.first_name} {ticket.user?.last_name} 
                        ({ticket.user?.email})
                      </p>
                      <p>
                        <strong>Category:</strong> {ticket.category}
                      </p>
                      <p>
                        <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
                      </p>
                      {ticket.resolved_at && (
                        <p>
                          <strong>Resolved:</strong> {new Date(ticket.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Start Working
                    </button>
                  )}
                  {['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                      disabled={processing}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {ticket.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'CLOSED')}
                      disabled={processing}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Close Ticket
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
                  >
                    {selectedTicket === ticket.id ? 'Hide Reply' : 'Reply'}
                  </button>
                </div>

                {/* Reply Box */}
                {selectedTicket === ticket.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReply(ticket.id)}
                        disabled={processing || !reply.trim()}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50"
                      >
                        Send Reply
                      </button>
                      <button
                        onClick={() => {
                          setReply('');
                          setSelectedTicket(null);
                        }}
                        className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, active, onClick }) {
  const colorClasses = {
    yellow: active ? 'from-yellow-500 to-yellow-600' : 'from-yellow-400 to-yellow-500',
    blue: active ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-500',
    green: active ? 'from-green-500 to-green-600' : 'from-green-400 to-green-500',
    gray: active ? 'from-gray-500 to-gray-600' : 'from-gray-400 to-gray-500',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition transform ${active ? 'scale-105 ring-4 ring-white dark:ring-gray-900' : 'hover:scale-105'}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    OPEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${styles[priority]}`}>
      {priority}
    </span>
  );
}