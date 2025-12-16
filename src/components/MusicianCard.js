"use client";
import Link from "next/link";
import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  const handleChat = (e) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/chat/${id}`); // Direct chat page
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
        {youtube && <FaYoutube size={22} className="text-red-600 hover:scale-110 transition" />}
        {socials?.instagram && <FaInstagram size={22} className="text-pink-500 hover:scale-110 transition" />}
        {socials?.twitter && <FaTwitter size={22} className="text-sky-500 hover:scale-110 transition" />}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mt-4">
        <Link href={`/musician/${id}`} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
          View Profile
        </Link>
        <button
          onClick={handleChat}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Chat
        </button>
      </div>
    </div>
  );
}




// // src/components/MusicianCard.js
// "use client";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
// import { FaStar } from "react-icons/fa6";
// import { FaCommentDots } from "react-icons/fa";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";

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

//   const { user } = useAuth();
//   const router = useRouter();

//   const startChat = async () => {
//     if (!user) return alert("You must be logged in to chat!");
//     if (user.role !== "CLIENT") return alert("Only clients can start a chat.");

//     // Check if conversation exists
//     const { data: existing } = await supabase
//       .from("conversations")
//       .select("*")
//       .eq("client_id", user.id)
//       .eq("musician_id", musician.id)
//       .single();

//     let conversationId;
//     if (existing) {
//       conversationId = existing.id;
//     } else {
//       const { data: newConv, error } = await supabase
//         .from("conversations")
//         .insert({
//           client_id: user.id,
//           musician_id: musician.id,
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error creating conversation:", error.message);
//         return alert("Failed to start chat. Please try again.");
//       }

//       conversationId = newConv.id;
//     }

//     router.push(`/chat/${conversationId}`);
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex flex-col gap-4 transition hover:shadow-lg hover:scale-[1.02]">
//       {/* Profile picture */}
//       <Link href={`/musician/${id}`}>
//         {profile_picture_url && (
//           <Image
//             src={profile_picture_url}
//             alt={`${name}'s profile`}
//             className="w-full h-48 object-cover rounded-xl"
//             width={400}
//             height={250}
//           />
//         )}
//       </Link>

//       <div>
//         <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
//         <p className="text-gray-600 dark:text-gray-300">{role}</p>

//         {/* Availability */}
//         <p
//           className={`mt-2 text-sm font-semibold ${
//             available ? "text-green-500" : "text-red-500"
//           }`}
//         >
//           {available ? "Available" : "Not Available"}
//         </p>

//         {/* Bio */}
//         {bio && (
//           <p className="mt-3 text-gray-700 dark:text-gray-400 text-sm">{bio}</p>
//         )}

//         {/* Gadgets */}
//         {gadget_specs && (
//           <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
//             <span className="font-semibold">Gear:</span>{" "}
//             {typeof gadget_specs === "string"
//               ? gadget_specs
//               : gadget_specs.map((g) => g.name).join(", ")}
//           </p>
//         )}
//       </div>

//       {/* Rating */}
//       {average_rating && (
//         <div className="flex items-center gap-1">
//           {[...Array(5)].map((_, i) => (
//             <FaStar
//               key={i}
//               size={18}
//               className={
//                 i < average_rating
//                   ? "text-yellow-400"
//                   : "text-gray-300 dark:text-gray-600"
//               }
//             />
//           ))}
//           <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
//             {average_rating.toFixed(1)}
//           </span>
//         </div>
//       )}

//       {/* Socials */}
//       <div className="flex items-center gap-4 mt-2">
//         {youtube && (
//           <FaYoutube size={22} className="text-red-600 hover:scale-110 transition" />
//         )}
//         {socials?.instagram && (
//           <FaInstagram size={22} className="text-pink-500 hover:scale-110 transition" />
//         )}
//         {socials?.twitter && (
//           <FaTwitter size={22} className="text-sky-500 hover:scale-110 transition" />
//         )}
//       </div>

//       {/* Chat Button for Clients */}
//       {user?.role === "CLIENT" && (
//         <button
//           onClick={startChat}
//           className="flex items-center justify-center gap-2 mt-3 bg-purple-700 text-white px-3 py-2 rounded hover:bg-purple-800"
//         >
//           <FaCommentDots /> Chat
//         </button>
//       )}
//     </div>
//   );
// }



