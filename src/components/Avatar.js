// // src/components/Avatar.js
import Image from 'next/image';
import React from 'react';

function getInitials(firstName = '', lastName = '') {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

export default function Avatar({ user }) {
  if (!user) return null;

  const profileImageUrl = user.profile_picture_url; // Supabase column
  const hasProfileImage = !!profileImageUrl;

  return (
    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-purple-800 text-white font-semibold overflow-hidden">
      {hasProfileImage ? (
        <Image
          src={profileImageUrl}
          alt={`${user.first_name}'s profile`}
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
      ) : (
        <span>{getInitials(user.first_name, user.last_name)}</span>
      )}
    </div>
  );
}


