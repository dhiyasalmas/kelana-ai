'use client'; // File error wajib berupa Client Component

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Mencatat error ke sistem monitoring/console
    console.error('KelanaAI Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans text-slate-800">
      <div className="text-center max-w-lg bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Ikon Pesawat Turbulensi / Peringatan */}
        <div className="text-7xl mb-6">✈️🌩️</div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">500</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-3">Pesawat Mengalami Turbulensi!</h2>
        
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Mesin AI kami sedang mengalami sedikit gangguan teknis. Jangan panik, teknisi kami (dan kode program) sedang berusaha memperbaikinya.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Tombol Reset mencoba memuat ulang komponen yang error tanpa merefresh seluruh halaman */}
          <button
            onClick={() => reset()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
          >
            Coba Muat Ulang
          </button>
          
          <Link 
            href="/" 
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all"
          >
            Kembali ke Awal
          </Link>
        </div>
      </div>
    </div>
  );
}