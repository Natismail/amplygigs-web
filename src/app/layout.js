// src/app/layout.js
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ["400", "500", "700"], // Regular, Medium, Bold
  subsets: ["latin"],
  variable: "--font-roboto",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "AmplyGigs",
  description: "Are you ready to meet amazing musicians or get the worthy platform?, connect now...",
  manifest: "/manifest.json",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA and Notification Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AmplyGigs" />
        
        {/* Notification Icons */}
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/icons/badge-72.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${inter.variable} antialiased`}
      >
        <div>
          <main className="flex-grow">
            <AuthProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </AuthProvider>
          </main>
        </div>

        {/* Service Worker Registration Script */}
        <Script 
          id="register-service-worker" 
          strategy="afterInteractive"
        >
          {`
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('✅ AmplyGigs Service Worker registered successfully:', registration.scope);
                    
                    // Listen for service worker updates
                    registration.addEventListener('updatefound', () => {
                      console.log('🔄 Service Worker update found');
                    });
                  })
                  .catch(function(error) {
                    console.error('❌ AmplyGigs Service Worker registration failed:', error);
                  });
              });

              // Listen for service worker messages
              navigator.serviceWorker.addEventListener('message', function(event) {
                console.log('📨 Message from Service Worker:', event.data);
              });
            } else {
              console.log('❌ Service Worker not supported in this browser');
            }
          `}
        </Script>

        {/* Notification Permission Helper Script */}
        <Script 
          id="notification-helper" 
          strategy="afterInteractive"
        >
          {`
            // Global notification helper functions for AmplyGigs
            window.AmplyGigs = window.AmplyGigs || {};
            
            window.AmplyGigs.requestNotificationPermission = async function() {
              if (!('Notification' in window)) {
                console.log('❌ This browser does not support notifications');
                return false;
              }

              if (Notification.permission === 'granted') {
                return true;
              }

              if (Notification.permission === 'denied') {
                console.log('❌ Notification permission denied');
                return false;
              }

              const permission = await Notification.requestPermission();
              return permission === 'granted';
            };

            window.AmplyGigs.showNotification = function(title, options = {}) {
              if (Notification.permission === 'granted') {
                const defaultOptions = {
                  icon: '/icons/icon-192.png',
                  badge: '/icons/badge-72.png',
                  tag: 'amplygigs-' + Date.now(),
                  renotify: true,
                  requireInteraction: false,
                  ...options
                };
                
                return new Notification(title, defaultOptions);
              }
            };

            // Test notification function (useful for debugging)
            window.AmplyGigs.testNotification = function() {
              window.AmplyGigs.showNotification('🎵 AmplyGigs Test', {
                body: 'Notifications are working! Ready for live tracking.',
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