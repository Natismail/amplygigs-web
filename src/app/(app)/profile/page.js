// src/app/(app)/profile/page.js - REDIRECT TO OWN PROFILE
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner, { 
  LogoSpinner, 
  FullScreenLoading,
  SkeletonMusicianCard,
  SkeletonEventCard,
  ProgressBar,
  PulseDots
} from '@/components/LoadingSpinner';
export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/profile/${user.id}`);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* <LoadingSpinner /> */}
      // Instead of generic spinner
   <LogoSpinner size="lg" message="Loading your profile..." />
   
    </div>
  );
}





