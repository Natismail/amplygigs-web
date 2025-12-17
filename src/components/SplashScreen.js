export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center 
      bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600
      animate-fade-in">

      <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-wide">
        AmplyGigs
      </h1>

      <p className="mt-3 text-white/90 text-sm md:text-base animate-pulse">
        Connecting skills to opportunities...
      </p>

    </div>
  );
}



// export default function SplashScreen() {
//   return (
//     <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
//       <h1 className="text-white text-4xl font-bold">AmplyGigs 1.0</h1>
//       <br className="px-8"/>
//             <h4 className="text-white text-sm font-bold">Connecting skills to platform...</h4>

//     </div>
//   );
// }
