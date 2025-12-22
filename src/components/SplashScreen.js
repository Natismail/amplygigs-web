// src/components/SplashScreen.js
"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center 
      bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600
      overflow-hidden">
      
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Logo/Icon */}
        <div className="mb-6 animate-bounce">
          <div className="text-7xl md:text-8xl">🎵</div>
        </div>

        {/* App Name */}
        <h1 className="text-white text-5xl md:text-6xl font-extrabold tracking-wide mb-2
          drop-shadow-2xl animate-fade-in">
          AmplyGigs
        </h1>

        {/* Version */}
        <div className="inline-block px-3 py-1 mb-4 bg-white/20 backdrop-blur-sm rounded-full">
          <span className="text-white/90 text-xs font-semibold">v1.0</span>
        </div>

        {/* Tagline with animated dots */}
        <p className="text-white/90 text-base md:text-lg font-medium mb-8
          animate-fade-in-delay">
          Connecting skills to opportunities{dots}
        </p>

        {/* Loading Spinner */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
    </div>
  );
}

// Add these animations to your globals.css or tailwind.config.js
/*
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-delay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in-delay 1s ease-out 0.3s both;
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}

.delay-700 {
  animation-delay: 700ms;
}
*/


// export default function SplashScreen() {
//   return (
//     <div className="fixed inset-0 z-50 flex flex-col items-center justify-center 
//       bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600
//       animate-fade-in">

//       <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-wide">
//         AmplyGigs
//       </h1>

//       <p className="mt-3 text-white/90 text-sm md:text-base animate-pulse">
//         Connecting skills to opportunities...
//       </p>

//     </div>
//   );
// }



// // export default function SplashScreen() {
// //   return (
// //     <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
// //       <h1 className="text-white text-4xl font-bold">AmplyGigs 1.0</h1>
// //       <br className="px-8"/>
// //             <h4 className="text-white text-sm font-bold">Connecting skills to platform...</h4>

// //     </div>
// //   );
// // }
