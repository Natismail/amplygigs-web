"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "./Avatar";
import Logo, { LogoIconOnly, LogoWithText, LogoLight } from '@/components/Logo';
import { Menu, Sun, Moon, MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
//import NotificationBell from '@/components/social/NotificationBell';
import NotificationBell from '@/components/NotificationBell';
import AmyAssistant from '@/components/ai/AmyAssistant'; // ⭐ NEW

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAmy, setShowAmy] = useState(false); // ⭐ NEW

  const shouldShowBack = pathname !== '/' && 
                         !pathname.startsWith('/login') && 
                         !pathname.startsWith('/signup') &&
                         !pathname.includes('/dashboard') &&
                         !pathname.includes('/home');

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      
      console.log('📊 Navbar unread count:', count);
      setUnreadMessages(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

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
          console.log("📨 Navbar: New message:", payload.new);
          setUnreadMessages((prev) => prev + 1);

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
          if (payload.new.read === true && !payload.old.read) {
            console.log("✅ Navbar: Message marked as read");
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    const handleMessagesRead = () => {
      console.log('🔄 Navbar: messagesRead event received - refreshing count');
      fetchUnreadCount();
    };

    window.addEventListener('messagesRead', handleMessagesRead);

    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [fetchUnreadCount]);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <nav className="sticky top-0 z-30 flex justify-between items-center px-3 sm:px-6 py-2 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {shouldShowBack && (
            <button
              onClick={handleBack}
              className="p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[30px] min-w-[30px] flex items-center justify-center"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white hidden sm:block">
              AmplyGigs
            </h1>
          </div> */}

              {/* <Logo size="lg" showText={true} href="/" /> */}

            {/* Desktop: Icon + Text */}
            <Logo 
              size="lg" 
              showText={true} 
              href="/" 
              variant="default"
              className="hidden sm:flex"
            />

            {/* Mobile: Icon Only */}
            <Logo 
              size="lg" 
              showText={false} 
              href="/" 
              variant="default"
              className="flex sm:hidden"
            />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* ⭐ AMY BUTTON - NEW */}
          <button
            onClick={() => setShowAmy(true)}
            className="relative p-2 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center group shadow-md hover:shadow-lg"
            aria-label="Ask Amy"
            title="Ask Amy (AI Assistant)"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            
            {/* Pulsing dot indicator */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white dark:border-gray-900" />
          </button>

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

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
              <Avatar user={user} size="sm" />
              <div className="hidden lg:block">
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

      {/* ⭐ AMY MODAL - Shows when button is clicked */}
      {showAmy && <AmyAssistant onClose={() => setShowAmy(false)} />}
    </>
  );
}
