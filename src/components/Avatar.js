// src/components/Avatar.js - IMPROVED WITH INITIALS
import React from 'react';

function getInitials(firstName = '', lastName = '') {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  } else if (firstInitial) {
    return firstInitial;
  } else {
    return '?';
  }
}

function getAvatarColor(userId) {
  // Generate consistent color based on user ID
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
  ];
  
  if (!userId) return colors[0];
  
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

export default function Avatar({ user, size = 'md' }) {
  if (!user) return null;

  const profileImageUrl = user.profile_picture_url;
  const hasProfileImage = !!profileImageUrl;
  
  // Size configurations
  const sizeClasses = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const gradientColor = getAvatarColor(user.id);

  return (
    <div className={`flex items-center justify-center ${sizeClass} rounded-full bg-gradient-to-br ${gradientColor} text-white font-semibold overflow-hidden shadow-md`}>
      {hasProfileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImageUrl}
          alt={`${user.first_name}'s profile`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<span class="font-bold">${getInitials(user.first_name, user.last_name)}</span>`;
          }}
        />
      ) : (
        <span className="font-bold">{getInitials(user.first_name, user.last_name)}</span>
      )}
    </div>
  );
}




// // src/components/Avatar.js - FIXED
// import React from 'react';

// function getInitials(firstName = '', lastName = '') {
//   const firstInitial = firstName.charAt(0).toUpperCase();
//   const lastInitial = lastName.charAt(0).toUpperCase();
//   return `${firstInitial}${lastInitial}`;
// }

// export default function Avatar({ user }) {
//   if (!user) return null;

//   const profileImageUrl = user.profile_picture_url; // Supabase column
//   const hasProfileImage = !!profileImageUrl;

//   return (
//     <div className="flex items-center justify-center h-9 w-9 rounded-full bg-purple-800 text-white font-semibold overflow-hidden">
//       {hasProfileImage ? (
//         // eslint-disable-next-line @next/next/no-img-element
//         <img
//           src={profileImageUrl}
//           alt={`${user.first_name}'s profile`}
//           className="w-full h-full rounded-full object-cover"
//         />
//       ) : (
//         <span>{getInitials(user.first_name, user.last_name)}</span>
//       )}
//     </div>
//   );
// }



// // // // src/components/Avatar.js
// // import Image from 'next/image';
// // import React from 'react';

// // function getInitials(firstName = '', lastName = '') {
// //   const firstInitial = firstName.charAt(0).toUpperCase();
// //   const lastInitial = lastName.charAt(0).toUpperCase();
// //   return `${firstInitial}${lastInitial}`;
// // }

// // export default function Avatar({ user }) {
// //   if (!user) return null;

// //   const profileImageUrl = user.profile_picture_url; // Supabase column
// //   const hasProfileImage = !!profileImageUrl;

// //   return (
// //     <div className="flex items-center justify-center h-9 w-9 rounded-full bg-purple-800 text-white font-semibold overflow-hidden">
// //       {hasProfileImage ? (
// //         <Image
// //           src={profileImageUrl}
// //           alt={`${user.first_name}'s profile`}
// //           width={36}
// //           height={36}
// //           className="rounded-full object-cover"
// //         />
// //       ) : (
// //         <span>{getInitials(user.first_name, user.last_name)}</span>
// //       )}
// //     </div>
// //   );
// // }


