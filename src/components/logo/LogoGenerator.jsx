"use client";

import { useEffect, useRef } from 'react';

export default function LogoGenerator() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#9333EA'); // Purple
    gradient.addColorStop(1, '#EC4899'); // Pink
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 128);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Headstock body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(180, 80, 152, 350, 20);
    ctx.fill();

    // Draw tuning pegs function
    const drawPeg = (x, y, color) => {
      // Outer circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Peg handle
      ctx.fillStyle = 'white';
      const handleX = x < 256 ? x - 18 : x;
      ctx.beginPath();
      ctx.roundRect(handleX, y - 4, 18, 8, 4);
      ctx.fill();
    };

    // Left pegs (purple)
    drawPeg(170, 130, '#9333EA');
    drawPeg(170, 200, '#9333EA');
    drawPeg(170, 270, '#9333EA');

    // Right pegs (pink)
    drawPeg(342, 130, '#EC4899');
    drawPeg(342, 200, '#EC4899');
    drawPeg(342, 270, '#EC4899');

    // Nut
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(231, 360, 50, 8, 2);
    ctx.fill();

    // String notches
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 2;
    [238, 248, 258].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 360);
      ctx.lineTo(x, 368);
      ctx.stroke();
    });
    
    ctx.strokeStyle = '#EC4899';
    [264, 269, 274].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 360);
      ctx.lineTo(x, 368);
      ctx.stroke();
    });

  }, []);

  const downloadLogo = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'amplygigs-logo.png';
    link.href = url;
    link.click();
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">AmplyGigs Logo Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your custom guitar headstock logo
        </p>
        
        <canvas 
          ref={canvasRef}
          className="border-4 border-purple-600 rounded-3xl shadow-2xl mx-auto mb-8"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        <button
          onClick={downloadLogo}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition"
        >
          Download Logo (512×512)
        </button>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
            <canvas ref={canvasRef} width="64" height="64" className="mx-auto" />
            <p className="text-xs mt-2">64×64</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
            <canvas ref={canvasRef} width="192" height="192" className="mx-auto" />
            <p className="text-xs mt-2">192×192</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
            <canvas ref={canvasRef} width="512" height="512" className="mx-auto" />
            <p className="text-xs mt-2">512×512</p>
          </div>
        </div>
      </div>
    </div>
  );
}