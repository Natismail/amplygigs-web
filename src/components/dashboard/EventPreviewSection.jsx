"use client";

import Link from "next/link";

export default function EventPreviewSection({
  title,
  description,
  items,
  renderItem,
  link,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <Link href={link} className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Nothing to show yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}
