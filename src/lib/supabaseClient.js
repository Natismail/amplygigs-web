// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
      },
    },
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }
});


// // src/lib/supabaseClient.js
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables');
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true,
//     storage: {
//       getItem: (key) => {
//         if (typeof window === 'undefined') return null;
//         return window.localStorage.getItem(key);
//       },
//       setItem: (key, value) => {
//         if (typeof window === 'undefined') return;
//         window.localStorage.setItem(key, value);
//       },
//       removeItem: (key) => {
//         if (typeof window === 'undefined') return;
//         window.localStorage.removeItem(key);
//       },
//     },
//   },
//   global: {
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//       'Prefer': 'return=representation'
//     }
//   }
// });




// // // src/lib/supabaseClient.js
// // import { createClient } from '@supabase/supabase-js';

// // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// // if (!supabaseUrl || !supabaseAnonKey) {
// //   throw new Error('Missing Supabase environment variables');
// // }

// // export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
// //   auth: {
// //     persistSession: true,
// //     autoRefreshToken: true,
// //     detectSessionInUrl: true,
// //     storage: {
// //       getItem: (key) => {
// //         if (typeof window === 'undefined') return null;
// //         return window.localStorage.getItem(key);
// //       },
// //       setItem: (key, value) => {
// //         if (typeof window === 'undefined') return;
// //         window.localStorage.setItem(key, value);
// //       },
// //       removeItem: (key) => {
// //         if (typeof window === 'undefined') return;
// //         window.localStorage.removeItem(key);
// //       },
// //     },
// //   },
// // });


// // // // lib/supabaseClient.js

// // // import { createClient } from "@supabase/supabase-js";

// // // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// // // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// // // if (!supabaseUrl || !supabaseAnonKey) {
// // //   throw new Error("Missing Supabase environment variables");
// // // }

// // // export const supabase = createClient(supabaseUrl, supabaseAnonKey);











// // // // // lib/supabaseClient.js
// // // // import { createClient } from "@supabase/supabase-js";

// // // // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// // // // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// // // // export const supabase = createClient(supabaseUrl, supabaseAnonKey);
