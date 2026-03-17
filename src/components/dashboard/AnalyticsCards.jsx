// src/components/dashboard/AnalyticsCards.jsx

//   • Accepts `currency` prop from parent (dashboard already computes displayCurrency)
//     → no more hardcoded ₦
//   • Null/zero guards on all values
//   • Dark mode text colors on values
//   • Icon + colour per card for visual hierarchy
//   • Rating shows stars when numeric

"use client";

import { formatCurrency } from "@/components/CurrencySelector";

const CARDS = [
  {
    key:   "totalGigs",
    label: "Total Gigs",
    icon:  "📅",
    color: "text-purple-600 dark:text-purple-400",
    bg:    "bg-purple-50 dark:bg-purple-900/20",
    format: (v) => v ?? 0,
  },
  {
    key:   "completedGigs",
    label: "Completed",
    icon:  "✅",
    color: "text-blue-600 dark:text-blue-400",
    bg:    "bg-blue-50 dark:bg-blue-900/20",
    format: (v) => v ?? 0,
  },
  {
    key:   "earnings",
    label: "Earnings",
    icon:  "💰",
    color: "text-green-600 dark:text-green-400",
    bg:    "bg-green-50 dark:bg-green-900/20",
    // formatted by the render loop using `currency` prop
    isEarnings: true,
  },
  {
    key:   "rating",
    label: "Rating",
    icon:  "⭐",
    color: "text-yellow-600 dark:text-yellow-400",
    bg:    "bg-yellow-50 dark:bg-yellow-900/20",
    format: (v) => (v ? `${Number(v).toFixed(1)} / 5` : "—"),
  },
];

/**
 * @param {{ stats: object, currency: string }} props
 *   stats    — { totalGigs, completedGigs, earnings, rating }
 *   currency — musician's rate_currency (e.g. 'USD', 'NGN') — computed in parent
 */
export default function AnalyticsCards({ stats = {}, currency = "NGN" }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {CARDS.map(({ key, label, icon, color, bg, format, isEarnings }) => {
        const raw   = stats[key];
        const value = isEarnings
          ? formatCurrency(raw ?? 0, currency)
          : format(raw);

        return (
          <div
            key={key}
            className={`rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {label}
              </p>
              <span className="text-lg">{icon}</span>
            </div>
            <p className={`text-xl font-bold ${color} truncate`}>
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}




