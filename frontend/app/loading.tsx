import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
      <div className="flex flex-col items-center">
        
        {/* Animasi Spinner dengan Ikon Pesawat */}
        <div className="relative flex justify-center items-center w-24 h-24 mb-6">
          {/* Cincin luar yang berputar */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          
          {/* Ikon di tengah */}
          <span className="text-3xl relative z-10 animate-pulse">✈️</span>
        </div>
        
        {/* Teks Pemuatan */}
        <h2 className="text-xl font-bold text-slate-800 tracking-tight animate-pulse mb-2">
          Memuat Destinasi...
        </h2>
        <p className="text-sm font-medium text-slate-500">
          KelanaAI sedang menyiapkan segalanya untukmu.
        </p>

      </div>
    </div>
  );
}