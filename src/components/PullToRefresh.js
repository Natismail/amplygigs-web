// src/components/PullToRefresh.js - MOBILE PULL-TO-REFRESH
"use client";

import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const PULL_THRESHOLD = 80; // Distance to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      // Only start if at top of page
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || startY.current === 0) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - startY.current;

      // Only pull down
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setIsPulling(false);
            setPullDistance(0);
            startY.current = 0;
          }, 500);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  const rotation = (pullDistance / PULL_THRESHOLD) * 360;
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullDistance - 40 : -60}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3"
          style={{ opacity }}
        >
          <RefreshCw
            className={`w-6 h-6 text-purple-600 dark:text-purple-400 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}