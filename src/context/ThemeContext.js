// src/context/ThemeContext.js - FIXED WITH PERSISTENCE
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    
    // Or detect system preference
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    
    // Use saved theme, fallback to system preference
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    
    // Apply theme immediately
    const root = window.document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};





// // src/context/ThemeContext.js
// "use client";

// import { createContext, useContext, useEffect, useState } from "react";

// const ThemeContext = createContext();

// export function ThemeProvider({ children }) {
//   const [theme, setTheme] = useState("light");

//   useEffect(() => {
//     const root = window.document.documentElement;
//     if (theme === "dark") {
//       root.classList.add("dark");
//     } else {
//       root.classList.remove("dark");
//     }
//   }, [theme]);

//   const toggleTheme = () =>
//     setTheme((prev) => (prev === "light" ? "dark" : "light"));

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export const useTheme = () => useContext(ThemeContext);
