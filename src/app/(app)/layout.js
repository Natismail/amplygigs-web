//src/app/(app)/layout.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ CRITICAL: Redirect to login if no user (ONLY ONCE)
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      console.log('❌ No user in (app) layout, redirecting to login');
      router.replace('/login'); // Use replace instead of push to avoid history issues
    }
  }, [loading, user, router]);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ✅ CRITICAL: Show loading ONLY while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ CRITICAL: Don't render layout if no user (return null immediately)
  if (!user) {
    return null;
  }

  // ✅ CRITICAL: Render layout WITHOUT any conditional mounting
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}





// //src/app/(app)/layout.js
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import Navbar from '@/components/Navbar';
// import Sidebar from '@/components/Sidebar';
// import { useAuth } from '@/context/AuthContext';

// export default function AppLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { loading, user } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();
  
//   // Track if we've already redirected
//   const [hasRedirected, setHasRedirected] = useState(false);

//   // ✅ CRITICAL FIX: Only redirect once, not on every render
//   useEffect(() => {
//     if (loading) return; // Wait for auth to finish loading
    
//     if (!user && !hasRedirected) {
//       console.log('❌ No user, redirecting to login...');
//       setHasRedirected(true);
//       router.push('/login');
//     }
//   }, [loading, user, router, hasRedirected]);

//   // Close sidebar on navigation
//   useEffect(() => {
//     setSidebarOpen(false);
//   }, [pathname]);

//   // Show loading state while checking auth
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 dark:text-gray-400">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show nothing while redirecting to login
//   if (!user) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
//       {/* Sidebar */}
//       <Sidebar
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//       />

//       {/* Main content wrapper - CRITICAL: Don't remount on navigation */}
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
//         {/* CRITICAL: Overflow here prevents full page reloads */}
//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }



// // //src/app/(app)/layout.js
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import Navbar from '@/components/Navbar';
// // import Sidebar from '@/components/Sidebar';
// // import { useAuth } from '@/context/AuthContext';

// // export default function AppLayout({ children }) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);
// //   const { loading, user } = useAuth();
// //   const router = useRouter();

// //   // ✅ FIXED: Move router.push to useEffect to avoid rendering during render
// //   useEffect(() => {
// //     if (!loading && !user) {
// //       router.push('/login');
// //     }
// //   }, [loading, user, router]);

// //   // Show loading state
// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
// //           <p className="text-gray-600 dark:text-gray-400">Loading...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Show nothing while redirecting
// //   if (!user) {
// //     return (
// //       <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
// //           <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
// //       {/* Sidebar */}
// //       <Sidebar
// //         isOpen={sidebarOpen}
// //         onClose={() => setSidebarOpen(false)}
// //       />

// //       {/* Main content */}
// //       <div className="flex flex-col flex-1 overflow-hidden">
// //         <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
// //         <main className="flex-1 overflow-y-auto p-6">
// //           {children}
// //         </main>
// //       </div>
// //     </div>
// //   );
// // }