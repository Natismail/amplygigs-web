// src/components/SplashScreen.jsx - ENHANCED VERSION
"use client";

import { useEffect, useState } from 'react';
import { LogoLight } from '@/components/Logo';


export default function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.5 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        {/* Logo Container with Animation */}
        <div className="relative mb-8">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 bg-white/10 rounded-full animate-ping"></div>
          </div>
          
          {/* Middle Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white/20 rounded-full animate-pulse"></div>
          </div>

          {/* Logo with Scale Animation */}
          <div className="relative animate-scale-fade">
            <svg
              className="w-28 h-28 mx-auto drop-shadow-2xl"
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White Chat Bubble for Splash */}
              <path
                d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
                fill="white"
                className="drop-shadow-lg"
              />
              
              {/* Purple Guitar Headstock */}
              <g fill="url(#splashGradient)" transform="rotate(58 60 50)">
                <rect x="50" y="15" width="35" height="50" rx="8" />
                <circle cx="45" cy="30" r="4" />
                <circle cx="90" cy="30" r="4" />
                <circle cx="45" cy="43" r="4" />
                <circle cx="90" cy="43" r="4" />
                <circle cx="45" cy="55" r="4" />
                <circle cx="90" cy="55" r="4" />
                <rect x="58" y="63" width="20" height="40" rx="2" />
              </g>
              
              {/* Gradient for Guitar */}
              <defs>
                <linearGradient
                  id="splashGradient"
                  x1="0"
                  y1="0"
                  x2="120"
                  y2="120"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#6B21A8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* <div className="bg-purple-600">
  <LogoLight size="lg" showText={true} />
</div> */}

        {/* Brand Name with Stagger Animation */}
        <div className="mb-4 overflow-hidden">
          <h1 className="text-5xl font-bold text-white animate-slide-up">
            AmplyGigs
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-purple-200 text-lg animate-fade-in-delay">
          Connecting Musicians & Opportunities
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-1"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-2"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-3"></div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes scale-fade {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-delay {
          0%, 30% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes bounce-sequence {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-fade {
          animation: scale-fade 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1s ease-out forwards;
        }

        .animate-bounce-1 {
          animation: bounce-sequence 1.4s infinite;
          animation-delay: 0s;
        }

        .animate-bounce-2 {
          animation: bounce-sequence 1.4s infinite;
          animation-delay: 0.2s;
        }

        .animate-bounce-3 {
          animation: bounce-sequence 1.4s infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}

// Mini Splash for Quick Transitions
export function MiniSplash({ message = '' }) {
  return (
    <div className="fixed inset-0 bg-purple-600/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin-slow mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
              fill="white"
            />
            <g fill="#9333EA" transform="rotate(58 60 50)">
              <rect x="50" y="15" width="35" height="50" rx="8" />
              <circle cx="45" cy="30" r="4" />
              <circle cx="90" cy="30" r="4" />
              <circle cx="45" cy="43" r="4" />
              <circle cx="90" cy="43" r="4" />
              <circle cx="45" cy="55" r="4" />
              <circle cx="90" cy="55" r="4" />
              <rect x="58" y="63" width="20" height="40" rx="2" />
            </g>
          </svg>
        </div>
        {message && (
          <p className="text-white text-lg font-medium">{message}</p>
        )}
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}


