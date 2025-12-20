// // src/components/Navbar.js
"use client";

import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-gray-800 transition-colors duration-300 h-[80px]">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-2xl">☰</button>
        <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">🎵 AmplyGigs</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {user.first_name} {user.last_name}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}




// "use client";

// import { useAuth } from "@/context/AuthContext";
// import Avatar from "./Avatar"; // Import the Avatar component

// export default function Navbar({ onMenuClick }) {
//   const { user } = useAuth();

//   return (
//     <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-gray-800 transition-colors duration-300 h-[80px]">
//       <div className="flex items-center gap-4">
//         {/* Hamburger (for sidebar) md:hidden*/}
//         <button onClick={onMenuClick} className="text-2xl">
//           ☰
//         </button>
//         <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
//           🎵 AmplyGigs
//         </h1>
//       </div>

//       <div className="flex items-center gap-4">
//         {user && (
//           <div className="flex items-center gap-3">
//             <Avatar user={user} />
//             <span className="font-medium text-gray-800 dark:text-gray-100">
//               {user.first_name} {user.last_name}
//             </span>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }