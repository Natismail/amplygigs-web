// src/components/kyc/shared/IDTypeSelector.js
"use client";

export default function IDTypeSelector({ 
  options, 
  selected, 
  onChange,
  className = ""
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`p-4 border-2 rounded-xl transition-all text-left ${
            selected === option.value
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          <div className="flex items-center gap-3">
            {option.icon && (
              <span className="text-3xl">{option.icon}</span>
            )}
            <div className="flex-1">
              <h3 className={`font-semibold transition-colors ${
                selected === option.value
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {option.label}
              </h3>
              {option.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              )}
            </div>
            {selected === option.value && (
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}