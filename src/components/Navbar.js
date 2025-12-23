// src/components/Navbar.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "./Avatar";
import { Menu, Sun, Moon, Bell } from "lucide-react";
import { useState } from "react";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 py-3 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white hidden sm:block">
            AmplyGigs
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-gray-700" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
            <Avatar user={user} size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role?.toLowerCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}




// // // src/components/Navbar.js
// "use client";

// import { useAuth } from "@/context/AuthContext";
// import Avatar from "./Avatar";

// export default function Navbar({ onMenuClick }) {
//   const { user } = useAuth();

//   return (
//     <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-gray-800 transition-colors duration-300 h-[80px]">
//       <div className="flex items-center gap-4">
//         <button onClick={onMenuClick} className="text-2xl">☰</button>
//         <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">🎵 AmplyGigs</h1>
//       </div>

//       <div className="flex items-center gap-4">
//         {user && (
//           <div className="flex items-center gap-3">
//             <Avatar user={user} />
//             <span className="font-medium text-gray-800 dark:text-gray-100">
//               {user.first_name} {user.last_name}
//             </span>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }


