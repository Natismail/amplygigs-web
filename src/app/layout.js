// src/app/layout.js - SERVER COMPONENT (no "use client")
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import PWARegister from '@/components/PWARegister';
import Providers from '@/components/Providers';
import Script from "next/script";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"] 
});

const roboto = Roboto({ 
  weight: ["400", "500", "700"], 
  subsets: ["latin"], 
  variable: "--font-roboto" 
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

// ✅ Metadata can only be exported from Server Components
export const metadata = {
  title: "AmplyGigs - Connect Musicians with Clients",
  description: "Real-time location tracking and booking platform for musicians and event organizers",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AmplyGigs",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AmplyGigs" />
        
        {/* Additional Icons */}
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/icons/badge-72.png" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${inter.variable} antialiased`}
      >
        <Providers>
          {children}
          <PWARegister />
        </Providers>

        {/* Service Worker Registration */}
        <Script 
          id="register-service-worker" 
          strategy="afterInteractive"
        >
          {`
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('✅ Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      console.log('🔄 Service Worker update found');
                      
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('✨ New version available! Refresh to update.');
                        }
                      });
                    });
                  })
                  .catch(function(error) {
                    console.error('❌ Service Worker registration failed:', error);
                  });
              });

              // Listen for messages from service worker
              navigator.serviceWorker.addEventListener('message', function(event) {
                console.log('📨 Message from Service Worker:', event.data);
              });
            } else {
              console.log('❌ Service Worker not supported');
            }
          `}
        </Script>

        {/* Notification Helpers */}
        <Script 
          id="notification-helper" 
          strategy="afterInteractive"
        >
          {`
            window.AmplyGigs = window.AmplyGigs || {};
            
            // Request notification permission
            window.AmplyGigs.requestNotificationPermission = async function() {
              if (!('Notification' in window)) {
                console.log('❌ Notifications not supported');
                return false;
              }
              
              if (Notification.permission === 'granted') {
                console.log('✅ Notifications already granted');
                return true;
              }
              
              if (Notification.permission === 'denied') {
                console.log('❌ Notifications denied');
                return false;
              }
              
              const permission = await Notification.requestPermission();
              console.log('Notification permission:', permission);
              return permission === 'granted';
            };

            // Show notification
            window.AmplyGigs.showNotification = function(title, options = {}) {
              if (Notification.permission !== 'granted') {
                console.log('⚠️ Notifications not granted');
                return null;
              }
              
              const defaultOptions = {
                icon: '/icons/icon-192.png',
                badge: '/icons/badge-72.png',
                tag: 'amplygigs-' + Date.now(),
                renotify: true,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                ...options
              };
              
              return new Notification(title, defaultOptions);
            };

            // Test notification
            window.AmplyGigs.testNotification = function() {
              window.AmplyGigs.showNotification('🎵 AmplyGigs Test', {
                body: 'Notifications are working perfectly!',
                icon: '/icons/icon-192.png'
              });
            };

            console.log('🎵 AmplyGigs notification helpers loaded');
          `}
        </Script>
      </body>
    </html>
  );
}
