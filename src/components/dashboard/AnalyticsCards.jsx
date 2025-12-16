"use client";

export default function AnalyticsCards({ stats }) {
  const items = [
    { label: "Total Gigs", value: stats.totalGigs },
    { label: "Completed Gigs", value: stats.completedGigs },
    { label: "Earnings", value: `₦${stats.earnings}` },
    { label: "Rating", value: stats.rating || "—" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-xl font-bold mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
