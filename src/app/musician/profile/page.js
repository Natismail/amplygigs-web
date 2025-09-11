'use client';

import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useAuth } from '@/context/AuthContext';
// ... other imports ...

export default function MusicianProfilePage() {
  const { user } = useAuth();

  if (!user) {
    // Handle loading or redirect
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.first_name}'s Profile</h1>
      {user.profile_picture_url && (
        <img src={user.profile_picture_url} alt="Profile" className="w-32 h-32 rounded-full" />
      )}
      <ProfilePictureUpload />
      {/* ... rest of your profile form ... */}
    </div>
  );
}