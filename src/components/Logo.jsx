// src/components/Logo.jsx - FIXED: Unique gradient IDs to prevent conflicts
"use client";

import Link from "next/link";
import { useId } from "react";

export default function Logo({
  size = "md",
  showText = true,
  href = "/",
  className = "",
  variant = "default", // 'default' | 'light' | 'dark' | 'white'
}) {
  // ⭐ FIX: Generate unique IDs for each logo instance
  const uniqueId = useId().replace(/:/g, '-');
  
  const sizes = {
    xs: { icon: "w-8 h-8", text: "text-base" },
    sm: { icon: "w-10 h-10", text: "text-lg" },
    md: { icon: "w-12 h-12", text: "text-xl" },
    lg: { icon: "w-14 h-14", text: "text-2xl" },
    xl: { icon: "w-20 h-20", text: "text-3xl" },
  };

  const currentSize = sizes[size] || sizes.md;

  const LogoIcon = () => {
    // For default variant, render both light and dark versions
    if (variant === 'default') {
      return (
        <>
          {/* Light Mode Version */}
          <svg
            className={`${currentSize.icon} dark:hidden flex-shrink-0`}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Purple Chat Bubble */}
            <path
              d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
              fill={`url(#purpleGradient-${uniqueId})`}
            />
            
            {/* White Guitar */}
            <g fill="white" transform="rotate(59 60 50)">
              <rect x="50" y="15" width="35" height="50" rx="8" />
              <circle cx="45" cy="29" r="4" />
              <circle cx="90" cy="29" r="4" />
              <circle cx="45" cy="41" r="4" />
              <circle cx="90" cy="41" r="4" />
              <circle cx="45" cy="53" r="4" />
              <circle cx="90" cy="53" r="4" />
              <rect x="58" y="60" width="20" height="40" rx="3" />
            </g>
            
            <defs>
              <linearGradient 
                id={`purpleGradient-${uniqueId}`} 
                x1="0" y1="0" x2="120" y2="120" 
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#6B21A8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Dark Mode Version */}
          <svg
            className={`${currentSize.icon} hidden dark:block flex-shrink-0`}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Light Purple Chat Bubble for Dark Mode */}
            <path
              d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
              fill={`url(#lightGradient-${uniqueId})`}
            />
            
            {/* Dark Purple Guitar for Contrast */}
            <g fill="#2D1B4E" transform="rotate(59 60 50)">
              <rect x="50" y="15" width="35" height="50" rx="8" />
              <circle cx="45" cy="29" r="4" />
              <circle cx="90" cy="29" r="4" />
              <circle cx="45" cy="41" r="4" />
              <circle cx="90" cy="41" r="4" />
              <circle cx="45" cy="53" r="4" />
              <circle cx="90" cy="53" r="4" />
              <rect x="58" y="60" width="20" height="40" rx="3" />
            </g>
            
            <defs>
              <linearGradient 
                id={`lightGradient-${uniqueId}`} 
                x1="0" y1="0" x2="120" y2="120" 
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
        </>
      );
    }

    // For specific variants, render single version
    const getVariantColors = () => {
      switch (variant) {
        case 'light':
          return {
            bubbleGradient: `purpleGradient-${uniqueId}`,
            guitarFill: 'white',
            stops: [
              { offset: "0%", color: "#9333EA" },
              { offset: "100%", color: "#6B21A8" }
            ]
          };
        case 'dark':
          return {
            bubbleGradient: `lightGradient-${uniqueId}`,
            guitarFill: '#2D1B4E',
            stops: [
              { offset: "0%", color: "#C084FC" },
              { offset: "100%", color: "#A855F7" }
            ]
          };
        case 'white':
          return {
            bubbleGradient: `whiteGradient-${uniqueId}`,
            guitarFill: '#9333EA',
            stops: [
              { offset: "0%", color: "#FFFFFF" },
              { offset: "100%", color: "#F3F4F6" }
            ]
          };
        default:
          return null;
      }
    };

    const colors = getVariantColors();
    if (!colors) return null;

    return (
      <svg
        className={`${currentSize.icon} flex-shrink-0`}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
          fill={`url(#${colors.bubbleGradient})`}
        />
        
        <g fill={colors.guitarFill} transform="rotate(59 60 50)">
          <rect x="50" y="15" width="35" height="50" rx="8" />
          <circle cx="45" cy="29" r="4" />
          <circle cx="90" cy="29" r="4" />
          <circle cx="45" cy="41" r="4" />
          <circle cx="90" cy="41" r="4" />
          <circle cx="45" cy="53" r="4" />
          <circle cx="90" cy="53" r="4" />
          <rect x="58" y="60" width="20" height="40" rx="3" />
        </g>
        
        <defs>
          <linearGradient 
            id={colors.bubbleGradient} 
            x1="0" y1="0" x2="120" y2="120" 
            gradientUnits="userSpaceOnUse"
          >
            {colors.stops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const content = (
    <div className={`flex items-center gap-1 flex-shrink-0 ${className}`}>
      <LogoIcon />
      {showText && (
        <span
          className={`font-bold whitespace-nowrap ${
            variant === 'white'
              ? 'text-white'
              : 'bg-gradient-to-r from-purple-500 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent -mt-2'
          } ${currentSize.text}`}
        >
          AmplyGigs
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-80 transition flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}

// Icon Only
export function LogoIconOnly({ size = "md", variant = "default", className = "" }) {
  return <Logo size={size} showText={false} href={null} variant={variant} className={className} />;
}

// Icon + Text
export function LogoWithText({ size = "md", variant = "default", className = "" }) {
  return <Logo size={size} showText={true} href={null} variant={variant} className={className} />;
}

// For use on dark backgrounds (splash screens, hero sections)
export function LogoLight({ size = "md", showText = true, className = "" }) {
  return <Logo size={size} showText={showText} href={null} variant="white" className={className} />;
}
