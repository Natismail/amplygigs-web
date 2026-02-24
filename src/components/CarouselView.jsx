// src/components/CarouselView.jsx
"use client";

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarouselView({ 
  items, 
  renderItem, 
  itemWidth = 280,
  gap = 16,
  showControls = true,
  className = ''
}) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    const scrollAmount = direction === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
    // Update arrows after scroll
    setTimeout(checkScroll, 300);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`relative group ${className}`}>
      {/* Left Arrow */}
      {showControls && showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="flex-shrink-0"
            style={{
              width: `${itemWidth}px`,
              scrollSnapAlign: 'start',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {showControls && showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
      )}

      {/* Scroll Indicator (Mobile Only) */}
      <div className="sm:hidden flex justify-center gap-1 mt-2">
        {Array.from({ length: Math.min(5, Math.ceil(items.length / 2)) }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
          />
        ))}
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Preset for Musician Cards
export function MusicianCarousel({ musicians, onMusicianClick }) {
  return (
    <CarouselView
      items={musicians}
      itemWidth={280}
      renderItem={(musician) => (
        <div
          onClick={() => onMusicianClick?.(musician)}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          {/* Your MusicianCard component here */}
          <MusicianCardCompact musician={musician} />
        </div>
      )}
    />
  );
}

// Preset for Event Cards
export function EventCarousel({ events, onEventClick }) {
  return (
    <CarouselView
      items={events}
      itemWidth={300}
      renderItem={(event) => (
        <div
          onClick={() => onEventClick?.(event)}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          {/* Your EventCard component here */}
          <EventCardCompact event={event} />
        </div>
      )}
    />
  );
}

// Compact Musician Card for Carousel
function MusicianCardCompact({ musician }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
      {/* Profile Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
        {musician.profile_picture_url ? (
          <img
            src={musician.profile_picture_url}
            alt={musician.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🎸
          </div>
        )}
        
        {/* Featured Badge */}
        {musician.is_featured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            ⭐ Featured
          </div>
        )}
        
        {/* Verified Badge */}
        {musician.is_verified && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
          {musician.display_name || `${musician.first_name} ${musician.last_name}`}
        </h3>
        
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
          {musician.primary_role || musician.professional_title}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{musician.average_rating?.toFixed(1) || 'New'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>{musician.total_bookings || 0} gigs</span>
          </div>
        </div>

        {/* Genres */}
        {musician.genres && musician.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {musician.genres.slice(0, 2).map((genre, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {musician.city && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            📍 {musician.city}{musician.country ? `, ${musician.country}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact Event Card for Carousel
function EventCardCompact({ event }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
      {/* Event Image */}
      <div className="relative h-40 bg-gradient-to-br from-purple-400 to-pink-400">
        {event.media_url || event.flyer_url ? (
          <img
            src={event.media_url || event.flyer_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🎤
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        {event.event_type && (
          <span className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
            {event.event_type}
          </span>
        )}

        {/* Date */}
        {event.event_date && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            📅 {new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        )}

        {/* Venue */}
        {event.venue && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
            📍 {event.venue}
          </p>
        )}

        {/* Budget */}
        {event.proposed_amount && (
          <p className="font-bold text-sm text-purple-600 dark:text-purple-400">
            ₦{event.proposed_amount.toLocaleString()}
          </p>
        )}

        {/* Interested Count */}
        {event.interested_count > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            👥 {event.interested_count} interested
          </p>
        )}
      </div>
    </div>
  );
}