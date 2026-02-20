
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Download,
  Share2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Ticket as TicketIcon,
} from "lucide-react";
import QRCode from "qrcode";

export default function TicketPurchasePage() {
  const params = useParams();
  const router = useRouter();

  const [purchase, setPurchase] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.purchaseId]);

  async function loadPurchase() {
    setLoading(true);
    try {
      const response = await fetch(`/api/ticket-purchases/${params.purchaseId}`);
      const result = await response.json();

      if (result.success) {
        setPurchase(result.data);

        // Generate QR codes for all tickets
        const codes = {};
        for (const ticket of result.data.tickets || []) {
          const qrDataUrl = await QRCode.toDataURL(ticket.ticket_code, {
            width: 300,
            margin: 2,
          });
          codes[ticket.id] = qrDataUrl;
        }
        setQrCodes(codes);
      }
    } catch (error) {
      console.error("Error loading purchase:", error);
    } finally {
      setLoading(false);
    }
  }

  const downloadTicket = async (ticket) => {
    const qrDataUrl = qrCodes[ticket.id];
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `ticket-${ticket.ticket_code}.png`;
    link.click();
  };

  const shareTicket = async (ticket) => {
    if (navigator.share) {
      await navigator.share({
        title: `Ticket for ${purchase.event.title}`,
        text: `My ticket code: ${ticket.ticket_code}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(ticket.ticket_code);
      alert("Ticket code copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Purchase Not Found
          </h2>
          <button
            onClick={() => router.push("/live-events")}
            className="text-purple-600 hover:underline"
          >
            Browse events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-8 text-white mb-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-lg">
            Your tickets have been sent to {purchase.guest_email}
          </p>
        </div>

        {/* Event Info */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {purchase.event.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              {new Date(purchase.event.event_date).toLocaleDateString("en-NG", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              {new Date(purchase.event.event_date).toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              {purchase.event.venue_name}
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              {purchase.tickets?.length || 0} ticket(s)
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-purple-600" />
            Your Tickets
          </h2>

          {purchase.tickets?.map((ticket, index) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    {qrCodes[ticket.id] && (
                      <img
                        src={qrCodes[ticket.id]}
                        alt="QR Code"
                        className="w-48 h-48 border-4 border-purple-500 rounded-lg"
                      />
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Ticket #{index + 1}
                        </h3>
                        <p className="text-purple-600 dark:text-purple-400 font-medium">
                          {ticket.tier?.tier_name}
                        </p>
                      </div>
                      {ticket.checked_in ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                          CHECKED IN
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                          VALID
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ticket Code
                        </span>
                        <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {ticket.ticket_code}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Holder
                        </span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {purchase.guest_full_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadTicket(ticket)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </button>
                      <button
                        onClick={() => shareTicket(ticket)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tear Line */}
              <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>

              {/* Stub */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {purchase.event.title}
                  </span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {ticket.ticket_code}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Order Summary
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Subtotal
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ₦
                {(
                  purchase.total_amount - purchase.platform_fee
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Platform Fee
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ₦{purchase.platform_fee.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total Paid
                </span>
                <span className="text-lg font-bold text-purple-600">
                  ₦{purchase.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Payment Reference: {purchase.payment_reference}
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Important Information
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Present your QR code at the venue entrance for check-in</li>
            <li>• Each ticket can only be used once</li>
            <li>
              • Save this page or download your tickets for offline access
            </li>
            <li>• Check your email for confirmation and ticket details</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.push("/live-events")}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Browse More Events
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            Print Tickets
          </button>
        </div>
      </div>
    </div>
  );
}