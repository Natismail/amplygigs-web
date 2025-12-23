// src/components/MusicianCard.js
"use client";
import Link from "next/link";
import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocial } from "@/context/SocialContext";
import { MessageCircle } from "lucide-react";

export default function MusicianCard({ musician }) {
  const {
    id,
    name,
    role,
    available,
    bio,
    socials,
    youtube,
    profile_picture_url,
    gadget_specs,
    average_rating,
  } = musician;

  const router = useRouter();
  const { getOrCreateConversation } = useSocial();

  const handleChat = async (e) => {
    e.stopPropagation();
    
    const { data, error } = await getOrCreateConversation(id);
    
    if (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
      return;
    }
    
    router.push('/messages');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex flex-col gap-4 transition hover:shadow-lg hover:scale-[1.02]">
      {/* Profile picture */}
      {profile_picture_url && (
        <Image
          src={profile_picture_url}
          alt={`${name}'s profile`}
          className="w-full h-48 object-cover rounded-xl"
          width={400}
          height={250}
        />
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
        <p className="text-gray-600 dark:text-gray-300">{role}</p>

        <p className={`mt-2 text-sm font-semibold ${available ? "text-green-500" : "text-red-500"}`}>
          {available ? "Available" : "Not Available"}
        </p>

        {bio && <p className="mt-3 text-gray-700 dark:text-gray-400 text-sm">{bio}</p>}

        {gadget_specs && (
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
            <span className="font-semibold">Gear:</span>{" "}
            {typeof gadget_specs === "string" ? gadget_specs : gadget_specs.map((g) => g.name).join(", ")}
          </p>
        )}
      </div>

      {average_rating && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              size={18}
              className={i < average_rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{average_rating.toFixed(1)}</span>
        </div>
      )}

      {/* Socials */}
      <div className="flex items-center gap-4 mt-2">
        {youtube && (
          <a href={youtube} target="_blank" rel="noopener noreferrer">
            <FaYoutube size={22} className="text-red-600 hover:scale-110 transition" />
          </a>
        )}
        {socials?.instagram && (
          <a href={socials.instagram} target="_blank" rel="noopener noreferrer">
            <FaInstagram size={22} className="text-pink-500 hover:scale-110 transition" />
          </a>
        )}
        {socials?.twitter && (
          <a href={socials.twitter} target="_blank" rel="noopener noreferrer">
            <FaTwitter size={22} className="text-sky-500 hover:scale-110 transition" />
          </a>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Link 
          href={`/musician/${id}`} 
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition"
        >
          View Profile
        </Link>
        <button
          onClick={handleChat}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </button>
      </div>
    </div>
  );
}






// "use client";
// import Link from "next/link";
// import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
// import { FaStar } from "react-icons/fa6";
// import { useRouter } from "next/navigation";
// import Image from "next/image";

// export default function MusicianCard({ musician }) {
//   const {
//     id,
//     name,
//     role,
//     available,
//     bio,
//     socials,
//     youtube,
//     profile_picture_url,
//     gadget_specs,
//     average_rating,
//   } = musician;

//   const router = useRouter();

//   const handleChat = (e) => {
//     e.stopPropagation(); // Prevent card click
//     router.push(`/chat/${id}`); // Direct chat page
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex flex-col gap-4 transition hover:shadow-lg hover:scale-[1.02]">
//       {/* Profile picture */}
//       {profile_picture_url && (
//         <Image
//           src={profile_picture_url}
//           alt={`${name}'s profile`}
//           className="w-full h-48 object-cover rounded-xl"
//           width={400}
//           height={250}
//         />
//       )}

//       <div>
//         <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
//         <p className="text-gray-600 dark:text-gray-300">{role}</p>

//         <p className={`mt-2 text-sm font-semibold ${available ? "text-green-500" : "text-red-500"}`}>
//           {available ? "Available" : "Not Available"}
//         </p>

//         {bio && <p className="mt-3 text-gray-700 dark:text-gray-400 text-sm">{bio}</p>}

//         {gadget_specs && (
//           <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
//             <span className="font-semibold">Gear:</span>{" "}
//             {typeof gadget_specs === "string" ? gadget_specs : gadget_specs.map((g) => g.name).join(", ")}
//           </p>
//         )}
//       </div>

//       {average_rating && (
//         <div className="flex items-center gap-1">
//           {[...Array(5)].map((_, i) => (
//             <FaStar
//               key={i}
//               size={18}
//               className={i < average_rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
//             />
//           ))}
//           <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{average_rating.toFixed(1)}</span>
//         </div>
//       )}

//       {/* Socials */}
//       <div className="flex items-center gap-4 mt-2">
//         {youtube && <FaYoutube size={22} className="text-red-600 hover:scale-110 transition" />}
//         {socials?.instagram && <FaInstagram size={22} className="text-pink-500 hover:scale-110 transition" />}
//         {socials?.twitter && <FaTwitter size={22} className="text-sky-500 hover:scale-110 transition" />}
//       </div>

//       {/* Action buttons */}
//       <div className="flex justify-between mt-4">
//         <Link href={`/musician/${id}`} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
//           View Profile
//         </Link>
//         <button
//           onClick={handleChat}
//           className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
//         >
//           Chat
//         </button>
//       </div>
//     </div>
//   );
// }


