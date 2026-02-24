// src/components/ViewToggle.jsx
"use client";

import { Grid, List, ArrowRightCircle } from "lucide-react";

export default function ViewToggle({ view, onChange, isMobile = false }) {
  const views = [
    { id: 'grid', icon: Grid, label: 'Grid', showOn: ['desktop', 'mobile'] },
    { id: 'list', icon: List, label: 'List', showOn: ['desktop'] },
    { id: 'carousel', icon: ArrowRightCircle, label: 'Carousel', showOn: ['mobile'] },
  ];

  // Filter views based on device
  const availableViews = views.filter(v => 
    isMobile ? v.showOn.includes('mobile') : v.showOn.includes('desktop')
  );

  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {availableViews.map((item) => {
        const Icon = item.icon;
        const isActive = view === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={item.label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

