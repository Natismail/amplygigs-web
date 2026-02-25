"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "./Avatar";
import Logo from '@/components/Logo';
import { Menu, Sun, Moon, MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from '@/components/NotificationBell';
import AmyAssistant from '@/components/ai/AmyAssistant';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAmy, setShowAmy] = useState(false);

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
      <nav className="sticky top-0 z-30 flex justify-between items-center px-2 h-[80px] sm:px-6 py-2 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Left Section */}
        <div className="flex items-center gap-0 sm:gap-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {shouldShowBack && (
            <button
              onClick={handleBack}
              className="p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[25px] flex items-center justify-center flex-shrink-0"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* ⭐ FIXED: Better mobile logo handling */}
          {/* Desktop: Icon + Text */}
          <div className="hidden sm:block">
            <Logo 
              size="lg" 
              showText={true} 
              href="/" 
              variant="default"
            />
          </div>

          {/* Mobile: Icon Only - SMALLER SIZE */}
          <div className="block sm:hidden">
            <Logo 
              size="sm" 
              showText={false} 
              href="/" 
              variant="default"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0">
          {/* ⭐ AMY BUTTON - Responsive sizing */}
          <button
            onClick={() => setShowAmy(true)}
            className="relative p-0 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg transition min-h-[30px] min-w-[30px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center group shadow-md hover:shadow-lg flex-shrink-0"
            aria-label="Ask Amy"
            title="Ask Amy (AI Assistant)"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse" />
            
            {/* Pulsing dot indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse border-2 border-white dark:border-gray-900" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            ) : (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            )}
          </button>

          {/* Messages Icon with Badge */}
          <Link
            href="/messages"
            className="relative p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Messages"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </Link>

          {/* Notification Bell */}
          <div className="flex-shrink-0">
            <NotificationBell />
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-gray-200 dark:border-gray-700 ml-1 sm:ml-2 flex-shrink-0">
              <Avatar user={user} size="sm" className="w-8 h-8 sm:w-10 sm:h-10" />
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
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