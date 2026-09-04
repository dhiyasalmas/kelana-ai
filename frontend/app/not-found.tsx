import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans text-slate-800">
      <div className="text-center max-w-lg">
        {/* Ikon Kompas / Peta (Ilustrasi teks) */}
        <div className="text-8xl mb-6">🧭</div>
        
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Ups! Kamu Tersesat dari Peta</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Destinasi atau halaman yang kamu cari sepertinya tidak ada, sudah pindah rute, atau belum pernah kita jelajahi.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}