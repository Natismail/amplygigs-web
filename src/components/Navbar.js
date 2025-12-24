// src/components/Navbar.js - UPDATED WITH MESSAGE NOTIFICATIONS
"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "./Avatar";
import { Menu, Sun, Moon, Bell, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import NotificationBell from '@/components/social/NotificationBell';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("read", false);

        if (error) throw error;
        setUnreadMessages(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`navbar-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📨 New message in navbar:", payload.new);
          setUnreadMessages((prev) => prev + 1);

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `${payload.new.sender_name || "Someone"} sent you a message`,
              icon: "/icons/icon-192.png",
              tag: "new-message",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.read === true) {
            setUnreadMessages((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

        {/* Messages Icon with Badge */}
        <Link
          href="/messages"
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Messages"
        >
          <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notification Bell (your existing component) */}
        <NotificationBell />

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





// // src/components/Navbar.js
// "use client";

// import { useAuth } from "@/context/AuthContext";
// import { useTheme } from "@/context/ThemeContext";
// import Avatar from "./Avatar";
// import { Menu, Sun, Moon, Bell } from "lucide-react";
// import { useState } from "react";
// import NotificationBell from '@/components/social/NotificationBell';


// export default function Navbar({ onMenuClick }) {
//   const { user } = useAuth();
//   const { theme, toggleTheme } = useTheme();
//   const [showNotifications, setShowNotifications] = useState(false);

//   return (
//     <nav className="sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 py-3 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
//       {/* Left Section */}
//       <div className="flex items-center gap-3">
//         <button
//           onClick={onMenuClick}
//           className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
//           aria-label="Open menu"
//         >
//           <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
//         </button>
        
//         <div className="flex items-center gap-2">
//           <span className="text-2xl">🎵</span>
//           <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white hidden sm:block">
//             AmplyGigs
//           </h1>
//         </div>
//       </div>

//       {/* Right Section */}
//       <div className="flex items-center gap-2 sm:gap-3">
//         {/* Theme Toggle */}
//         <button
//           onClick={toggleTheme}
//           className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
//           aria-label="Toggle theme"
//         >
//           {theme === "light" ? (
//             <Moon className="w-5 h-5 text-gray-700" />
//           ) : (
//             <Sun className="w-5 h-5 text-yellow-400" />
//           )}
//         </button>

//         {/* Notifications */}
//         {/* <div className="relative">
//           <button
//             onClick={() => setShowNotifications(!showNotifications)}
//             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center relative"
//             aria-label="Notifications"
//           >
//             <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//           </button> */}

//           {/* Notifications Dropdown */}
//           {/* {showNotifications && (
//             <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
//               <div className="p-3 border-b border-gray-200 dark:border-gray-700">
//                 <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
//               </div>
//               <div className="max-h-96 overflow-y-auto">
//                 <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
//                   No new notifications
//                 </div>
//               </div>
//             </div>
//           )} 


//         </div>*/}   
//           <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
// <NotificationBell />


//         {/* User Profile */}
//         {user && (
//           <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
//             <Avatar user={user} size="sm" />
//             <div className="hidden sm:block">
//               <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
//                 {user.first_name} {user.last_name}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
//                 {user.role?.toLowerCase()}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }




// // // // src/components/Navbar.js
// // "use client";

// // import { useAuth } from "@/context/AuthContext";
// // import Avatar from "./Avatar";

// // export default function Navbar({ onMenuClick }) {
// //   const { user } = useAuth();

// //   return (
// //     <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-gray-800 transition-colors duration-300 h-[80px]">
// //       <div className="flex items-center gap-4">
// //         <button onClick={onMenuClick} className="text-2xl">☰</button>
// //         <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">🎵 AmplyGigs</h1>
// //       </div>

// //       <div className="flex items-center gap-4">
// //         {user && (
// //           <div className="flex items-center gap-3">
// //             <Avatar user={user} />
// //             <span className="font-medium text-gray-800 dark:text-gray-100">
// //               {user.first_name} {user.last_name}
// //             </span>
// //           </div>
// //         )}
// //       </div>
// //     </nav>
// //   );
// // }


