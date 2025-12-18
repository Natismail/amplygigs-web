// //src/components/BookingCard.js

"use client";

import { useRouter } from "next/navigation";

export default function BookingCard({
  booking,
  showActions = false,
  footer = null,
}) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/client/bookings/${booking.id}`);
  };

  const paymentBadge = () => {
    if (!booking.payment_status || booking.payment_status === "pending") {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
          Unpaid
        </span>
      );
    }
    if (booking.payment_status === "paid" && !booking.funds_released_at) {
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          In Escrow
        </span>
      );
    }
    if (booking.funds_released_at) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
          Complete
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={handleNavigate}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition"
    >
      {/* MAIN CONTENT */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {booking.events?.title || "Event"}
          </h3>
          {paymentBadge()}
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            🎵
            <span>
              {booking.musician?.first_name} {booking.musician?.last_name}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate">
            📍 <span className="truncate">{booking.event_location}</span>
          </div>
          <div className="flex items-center gap-2">
            📅{" "}
            {new Date(booking.event_date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500">Amount</span>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            ₦{booking.amount?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      {/* FOOTER ACTIONS (optional) */}
      {showActions && footer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-4 bg-gray-50 dark:bg-gray-900/50"
        >
          {footer}
        </div>
      )}
    </div>
  );
}



// //src/components/BookingCard.js




// "use client";

// import { useRouter } from "next/navigation";

// export default function BookingCard({
//   booking,
//   children,
//   disabled = false,
// }) {
//   const router = useRouter();

//   return (
//     <div
//       onClick={() => !disabled && router.push(`/client/bookings/${booking.id}`)}
//       className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden
//         ${disabled ? "opacity-70 cursor-default" : "cursor-pointer hover:shadow-md transition"}
//       `}
//     >
//       <div className="p-4">
//         <div className="flex items-start justify-between mb-3">
//           <div className="flex-1">
//             <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
//               {booking.events?.title || "Event"}
//             </h3>
//             {children?.badge}
//           </div>
//         </div>

//         <div className="space-y-2 text-sm mb-4">
//           <div className="flex items-center text-gray-600 dark:text-gray-400">
//             <span className="w-6">🎵</span>
//             <span>
//               {booking.musician?.first_name} {booking.musician?.last_name}
//             </span>
//           </div>

//           <div className="flex items-center text-gray-600 dark:text-gray-400">
//             <span className="w-6">📍</span>
//             <span className="truncate">{booking.event_location}</span>
//           </div>

//           <div className="flex items-center text-gray-600 dark:text-gray-400">
//             <span className="w-6">📅</span>
//             <span>
//               {new Date(booking.event_date).toLocaleDateString()}
//             </span>
//           </div>
//         </div>
//       </div>

//       {children?.actions && (
//         <div
//           className="p-4 bg-gray-50 dark:bg-gray-900/50"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {children.actions}
//         </div>
//       )}
//     </div>
//   );
// }





// export default function BookingCard({ booking }) {
//   return (
//     <div className="p-4 border rounded shadow mb-2">
//       <h3 className="text-lg font-bold">{booking.event}</h3>
//       <p className="text-gray-600">{booking.date}</p>
//       <p>
//         Status: <span className="font-semibold">{booking.status}</span>
//       </p>
//     </div>
//   );
// }
