// src/components/PWARegister.js
"use client";

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 New service worker found');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 New content available, refresh to update');
                // Optionally show update notification
              }
            });
          });

          // Handle updates
          if (registration.waiting) {
            console.log('⏳ Service worker waiting to activate');
          }
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listen for controller change (when SW updates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller changed, reloading...');
        window.location.reload();
      });
    } else {
      console.warn('⚠️ Service Workers not supported');
    }

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('📱 Install prompt available');
      setInstallPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App already installed');
      setShowInstallButton(false);
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('✅ App installed successfully');
      setShowInstallButton(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      console.log('⚠️ No install prompt available');
      return;
    }

    console.log('📱 Showing install prompt');
    installPrompt.prompt();
    
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
      setShowInstallButton(false);
    } else {
      console.log('❌ User dismissed install');
    }
    
    setInstallPrompt(null);
  };

  // Update service worker manually
  const handleUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-2xl p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Install AmplyGigs</h3>
          <p className="text-sm opacity-90 mb-3">
            Add to your home screen for quick access and offline support
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 active:scale-95 transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallButton(false)}
              className="px-4 py-2 rounded-lg text-sm hover:bg-purple-800 active:scale-95 transition"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstallButton(false)}
          className="text-white hover:text-gray-200 text-xl leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}