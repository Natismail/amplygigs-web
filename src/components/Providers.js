// src/components/Providers.js
"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider } from "@/context/DataContext";
import { SocialProvider } from "@/context/SocialContext"; // ← Add this

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SocialProvider>
            {children}
          </SocialProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


// // src/components/Providers.js
// "use client";

// import { AuthProvider } from "@/context/AuthContext";
// import { ThemeProvider } from "@/context/ThemeContext";
// import { DataProvider } from "@/context/DataContext";

// export default function Providers({ children }) {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <DataProvider>
//           {children}
//         </DataProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }