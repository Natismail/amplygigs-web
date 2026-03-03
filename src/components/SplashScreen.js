// src/components/SplashScreen.jsx
"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState("enter"); // enter → hold → exit

  useEffect(() => {
    // Hold for 1.8s then start exit
    const hold = setTimeout(() => setPhase("exit"), 1800);
    return () => clearTimeout(hold);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #6b21a8 80%, #9333ea 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="splash-blob blob-1" />
        <div className="splash-blob blob-2" />
        <div className="splash-blob blob-3" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center">

        {/* Logo mark */}
        <div className="logo-wrap relative mb-8">
          {/* Pulse rings */}
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />

          {/* Icon card */}
          <div className="icon-card">
            <svg viewBox="0 0 120 120" className="w-20 h-20" xmlns="http://www.w3.org/2000/svg">
              {/* Chat bubble */}
              <path
                d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L42 104V87H33C25 87 18 80 18 72V30Z"
                fill="white"
                opacity="0.95"
              />
              {/* Guitar headstock */}
              <g transform="rotate(58 60 50)">
                <defs>
                  <linearGradient id="gtr" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#6b21a8" />
                  </linearGradient>
                </defs>
                <rect x="50" y="15" width="35" height="50" rx="8" fill="url(#gtr)" />
                <circle cx="45" cy="30" r="4" fill="url(#gtr)" />
                <circle cx="90" cy="30" r="4" fill="url(#gtr)" />
                <circle cx="45" cy="43" r="4" fill="url(#gtr)" />
                <circle cx="90" cy="43" r="4" fill="url(#gtr)" />
                <circle cx="45" cy="55" r="4" fill="url(#gtr)" />
                <circle cx="90" cy="55" r="4" fill="url(#gtr)" />
                <rect x="58" y="63" width="20" height="40" rx="2" fill="url(#gtr)" />
              </g>
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div className="brand-name mb-2">
          {"AmplyGigs".split("").map((char, i) => (
            <span
              key={i}
              className="brand-char"
              style={{ animationDelay: `${0.35 + i * 0.045}s` }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p className="tagline">Connecting Skills to Platform</p>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" />
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dot" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ── Blobs ── */
        .splash-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          animation: blobFloat 6s ease-in-out infinite alternate;
        }
        .blob-1 { width: 420px; height: 420px; background: #a855f7; top: -120px; left: -80px; animation-delay: 0s; }
        .blob-2 { width: 320px; height: 320px; background: #7c3aed; bottom: -80px; right: -60px; animation-delay: 1.5s; }
        .blob-3 { width: 240px; height: 240px; background: #c084fc; top: 40%; left: 55%; animation-delay: 3s; }

        @keyframes blobFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(20px, 30px) scale(1.08); }
        }

        /* ── Logo wrap + rings ── */
        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 160px;
          height: 160px;
        }

        .ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.18);
          animation: ringPulse 2.4s ease-out infinite;
        }
        .ring-1 { width: 160px; height: 160px; animation-delay: 0s; }
        .ring-2 { width: 128px; height: 128px; animation-delay: 0.5s; }
        .ring-3 { width: 100px; height: 100px; animation-delay: 1s; }

        @keyframes ringPulse {
          0%   { transform: scale(0.85); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        /* ── Icon card ── */
        .icon-card {
          position: relative;
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
          animation: iconPop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        @keyframes iconPop {
          0%   { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }

        /* ── Brand name ── */
        .brand-name {
          display: flex;
          gap: 1px;
        }

        .brand-char {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
          opacity: 0;
          transform: translateY(18px);
          animation: charRise 0.45s ease-out forwards;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }

        @keyframes charRise {
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Tagline ── */
        .tagline {
          color: rgba(233,213,255,0.8);
          font-size: 0.9rem;
          letter-spacing: 0.06em;
          opacity: 0;
          animation: fadeUp 0.6s ease-out 0.85s forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Progress bar ── */
        .progress-track {
          width: 120px;
          height: 2px;
          background: rgba(255,255,255,0.12);
          border-radius: 9999px;
          margin-top: 20px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #c084fc, #ffffff);
          border-radius: 9999px;
          animation: progressGrow 1.6s ease-out 0.2s forwards;
        }

        @keyframes progressGrow {
          to { width: 100%; }
        }

        /* ── Dots ── */
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          animation: dotPop 1.2s ease-in-out infinite;
        }

        @keyframes dotPop {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

/* ─── Mini Splash — for page transitions ────────────────────────────────── */
export function MiniSplash({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #3b0764 50%, #6b21a8 100%)" }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Spinning logo */}
        <div className="mini-spin">
          <div
            style={{
              width: 64, height: 64,
              background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg viewBox="0 0 120 120" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L42 104V87H33C25 87 18 80 18 72V30Z" fill="white" opacity="0.9" />
              <g transform="rotate(58 60 50)">
                <rect x="50" y="15" width="35" height="50" rx="8" fill="#9333ea" />
                <circle cx="45" cy="30" r="4" fill="#9333ea" />
                <circle cx="90" cy="30" r="4" fill="#9333ea" />
                <circle cx="45" cy="43" r="4" fill="#9333ea" />
                <circle cx="90" cy="43" r="4" fill="#9333ea" />
                <circle cx="45" cy="55" r="4" fill="#9333ea" />
                <circle cx="90" cy="55" r="4" fill="#9333ea" />
                <rect x="58" y="63" width="20" height="40" rx="2" fill="#9333ea" />
              </g>
            </svg>
          </div>
        </div>

        {message && (
          <p style={{ color: "rgba(233,213,255,0.85)", fontSize: "0.9rem", letterSpacing: "0.05em" }}>
            {message}
          </p>
        )}

        {/* Three dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mini-dot" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .mini-spin {
          animation: miniPulse 1.8s ease-in-out infinite;
        }
        @keyframes miniPulse {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
        .mini-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          animation: miniDot 1.2s ease-in-out infinite;
        }
        @keyframes miniDot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40%            { transform: scale(1.3); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}







// // src/components/SplashScreen.jsx - ENHANCED VERSION
// "use client";

// import { useEffect, useState } from 'react';
// import { LogoLight } from '@/components/Logo';


// export default function SplashScreen() {
//   const [fadeOut, setFadeOut] = useState(false);

//   useEffect(() => {
//     // Start fade out after 1.5 seconds
//     const timer = setTimeout(() => {
//       setFadeOut(true);
//     }, 1500);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div 
//       className={`fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
//         fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
//       }`}
//     >
//       <div className="text-center">
//         {/* Logo Container with Animation */}
//         <div className="relative mb-8">
//           {/* Outer Glow Ring */}
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="w-40 h-40 bg-white/10 rounded-full animate-ping"></div>
//           </div>
          
//           {/* Middle Ring */}
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="w-32 h-32 bg-white/20 rounded-full animate-pulse"></div>
//           </div>

//           {/* Logo with Scale Animation */}
//           <div className="relative animate-scale-fade">
//             <svg
//               className="w-28 h-28 mx-auto drop-shadow-2xl"
//               viewBox="0 0 120 120"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               {/* White Chat Bubble for Splash */}
//               <path
//                 d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
//                 fill="white"
//                 className="drop-shadow-lg"
//               />
              
//               {/* Purple Guitar Headstock */}
//               <g fill="url(#splashGradient)" transform="rotate(58 60 50)">
//                 <rect x="50" y="15" width="35" height="50" rx="8" />
//                 <circle cx="45" cy="30" r="4" />
//                 <circle cx="90" cy="30" r="4" />
//                 <circle cx="45" cy="43" r="4" />
//                 <circle cx="90" cy="43" r="4" />
//                 <circle cx="45" cy="55" r="4" />
//                 <circle cx="90" cy="55" r="4" />
//                 <rect x="58" y="63" width="20" height="40" rx="2" />
//               </g>
              
//               {/* Gradient for Guitar */}
//               <defs>
//                 <linearGradient
//                   id="splashGradient"
//                   x1="0"
//                   y1="0"
//                   x2="120"
//                   y2="120"
//                   gradientUnits="userSpaceOnUse"
//                 >
//                   <stop offset="0%" stopColor="#9333EA" />
//                   <stop offset="100%" stopColor="#6B21A8" />
//                 </linearGradient>
//               </defs>
//             </svg>
//           </div>
//         </div>

//         {/* <div className="bg-purple-600">
//   <LogoLight size="lg" showText={true} />
// </div> */}

//         {/* Brand Name with Stagger Animation */}
//         <div className="mb-4 overflow-hidden">
//           <h1 className="text-5xl font-bold text-white animate-slide-up">
//             AmplyGigs
//           </h1>
//         </div>

//         {/* Tagline */}
//         <p className="text-purple-200 text-lg animate-fade-in-delay">
//           Connecting Musicians & Opportunities
//         </p>

//         {/* Loading Dots */}
//         <div className="flex justify-center gap-2 mt-8">
//           <div className="w-2 h-2 bg-white rounded-full animate-bounce-1"></div>
//           <div className="w-2 h-2 bg-white rounded-full animate-bounce-2"></div>
//           <div className="w-2 h-2 bg-white rounded-full animate-bounce-3"></div>
//         </div>
//       </div>

//       {/* Custom Animations */}
//       <style jsx>{`
//         @keyframes scale-fade {
//           0% {
//             transform: scale(0.8);
//             opacity: 0;
//           }
//           50% {
//             transform: scale(1.05);
//           }
//           100% {
//             transform: scale(1);
//             opacity: 1;
//           }
//         }
        
//         @keyframes slide-up {
//           0% {
//             transform: translateY(20px);
//             opacity: 0;
//           }
//           100% {
//             transform: translateY(0);
//             opacity: 1;
//           }
//         }
        
//         @keyframes fade-in-delay {
//           0%, 30% {
//             opacity: 0;
//           }
//           100% {
//             opacity: 1;
//           }
//         }

//         @keyframes bounce-sequence {
//           0%, 80%, 100% {
//             transform: scale(0);
//             opacity: 0.5;
//           }
//           40% {
//             transform: scale(1);
//             opacity: 1;
//           }
//         }
        
//         .animate-scale-fade {
//           animation: scale-fade 0.8s ease-out forwards;
//         }
        
//         .animate-slide-up {
//           animation: slide-up 0.6s ease-out 0.3s forwards;
//           opacity: 0;
//         }
        
//         .animate-fade-in-delay {
//           animation: fade-in-delay 1s ease-out forwards;
//         }

//         .animate-bounce-1 {
//           animation: bounce-sequence 1.4s infinite;
//           animation-delay: 0s;
//         }

//         .animate-bounce-2 {
//           animation: bounce-sequence 1.4s infinite;
//           animation-delay: 0.2s;
//         }

//         .animate-bounce-3 {
//           animation: bounce-sequence 1.4s infinite;
//           animation-delay: 0.4s;
//         }
//       `}</style>
//     </div>
//   );
// }

// // Mini Splash for Quick Transitions
// export function MiniSplash({ message = '' }) {
//   return (
//     <div className="fixed inset-0 bg-purple-600/90 backdrop-blur-sm flex items-center justify-center z-50">
//       <div className="text-center">
//         <div className="animate-spin-slow mb-4">
//           <svg
//             className="w-16 h-16 mx-auto"
//             viewBox="0 0 120 120"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
//               fill="white"
//             />
//             <g fill="#9333EA" transform="rotate(58 60 50)">
//               <rect x="50" y="15" width="35" height="50" rx="8" />
//               <circle cx="45" cy="30" r="4" />
//               <circle cx="90" cy="30" r="4" />
//               <circle cx="45" cy="43" r="4" />
//               <circle cx="90" cy="43" r="4" />
//               <circle cx="45" cy="55" r="4" />
//               <circle cx="90" cy="55" r="4" />
//               <rect x="58" y="63" width="20" height="40" rx="2" />
//             </g>
//           </svg>
//         </div>
//         {message && (
//           <p className="text-white text-lg font-medium">{message}</p>
//         )}
//       </div>

//       <style jsx>{`
//         @keyframes spin-slow {
//           from {
//             transform: rotate(0deg);
//           }
//           to {
//             transform: rotate(360deg);
//           }
//         }
        
//         .animate-spin-slow {
//           animation: spin-slow 3s linear infinite;
//         }
//       `}</style>
//     </div>
//   );
// }


