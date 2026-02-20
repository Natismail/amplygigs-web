"use client";

import { useState } from 'react';
import { 
  MUSICIAN_CATEGORIES, 
  getAllCategories, 
  getSubcategories,
  getCategoryIcon 
} from '@/lib/constants/musicianCategories';
import { Plus, X, Check, Star } from 'lucide-react';

export default function CategorySelector({ value = [], onChange, error }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [showSubcategories, setShowSubcategories] = useState(false);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategories([]);
    setShowSubcategories(true);
  };

  const toggleSubcategory = (subcategory) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory)
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const handleAddCategory = () => {
    if (!selectedCategory || selectedSubcategories.length === 0) {
      return;
    }

    const newCategory = {
      category: selectedCategory,
      subcategories: selectedSubcategories,
      isPrimary: value.length === 0 // First one is primary
    };

    onChange([...value, newCategory]);
    
    // Reset
    setSelectedCategory('');
    setSelectedSubcategories([]);
    setShowSubcategories(false);
  };

  const handleRemoveCategory = (index) => {
    const updated = value.filter((_, i) => i !== index);
    
    // If we removed the primary, make the next one primary
    if (updated.length > 0 && value[index].isPrimary) {
      updated[0].isPrimary = true;
    }
    
    onChange(updated);
  };

  const handleSetPrimary = (index) => {
    const updated = value.map((cat, i) => ({
      ...cat,
      isPrimary: i === index
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">⚠️</span>
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Selected Categories Display */}
      {value.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Categories ({value.length})
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.find(v => v.isPrimary) ? 'Primary marked with ⭐' : ''}
            </span>
          </div>
          
          {value.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition ${
                item.isPrimary
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {item.category}
                      </h5>
                      {item.isPrimary && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-600 text-white rounded-full">
                          <Star className="w-3 h-3 fill-white" />
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.subcategories.length} skill{item.subcategories.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  aria-label="Remove category"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Subcategories */}
              <div className="flex flex-wrap gap-2 mb-3">
                {item.subcategories.map((sub, subIdx) => (
                  <span
                    key={subIdx}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
              
              {/* Set as Primary Button */}
              {!item.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  <Star className="w-3 h-3" />
                  Set as primary category
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Category */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {value.length === 0 ? (
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                Select Your Primary Category *
              </span>
            ) : (
              'Add Another Category (Optional)'
            )}
          </h4>
          {value.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.length}/10
            </span>
          )}
        </div>

        {/* Step 1: Select Category */}
        {!showSubcategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {getAllCategories().map((category) => {
              const isAlreadySelected = value.some(v => v.category === category);
              
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => !isAlreadySelected && handleCategorySelect(category)}
                  disabled={isAlreadySelected}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isAlreadySelected
                      ? 'bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:scale-105 active:scale-95'
                  }`}
                >
                  <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {category}
                  </div>
                  {isAlreadySelected && (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Added
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Step 2: Select Subcategories */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(selectedCategory)}</span>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">
                    {selectedCategory}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {MUSICIAN_CATEGORIES[selectedCategory]?.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubcategories(false);
                  setSelectedCategory('');
                  setSelectedSubcategories([]);
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                ← Back
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select all instruments/skills you can perform with:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {getSubcategories(selectedCategory).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => toggleSubcategory(sub)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSubcategories.includes(sub)
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {selectedSubcategories.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  ✓ {selectedSubcategories.length} skill{selectedSubcategories.length > 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Multi-Talented Musician Tips
        </h5>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">✓</span>
            <span>Add all categories you perform in to increase booking opportunities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">✓</span>
            <span>Your primary category will be featured prominently on your profile</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">✓</span>
            <span>Clients can find you by ANY of your skills in search</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">✓</span>
            <span>More categories = up to 3x more visibility!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

