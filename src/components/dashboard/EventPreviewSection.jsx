// src/components/dashboard/EventPreviewSection.jsx
"use client";

import Link from "next/link";

export default function EventPreviewSection({
  title,
  description,
  items = [],
  renderItem,
  link,
  emptyMessage = "Nothing to show yet.",
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {link && (
          <Link
            href={link}
            className="text-sm text-blue-600 hover:underline min-h-[44px] flex items-center"
          >
            View all
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}


