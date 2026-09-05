import Link from 'next/link';
import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
      
      {/* Header Sederhana */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
          ✈️ KelanaAI
        </Link>
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          Kembali ke Beranda &rarr;
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* Bagian Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Menjelajah Dunia dengan <span className="text-blue-600">Kecerdasan Buatan</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            KelanaAI bukanlah sekadar agen perjalanan biasa. Kami adalah asisten travel pintar yang ditenagai oleh model AI mutakhir untuk merancang petualangan yang dipersonalisasi khusus untukmu.
          </p>
        </div>

        {/* Bagian Fitur / Teknologi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Teknologi RAG</h2>
            <p className="text-slate-600 leading-relaxed">
              Kami menggunakan arsitektur <strong className="text-slate-800">Retrieval-Augmented Generation (RAG)</strong>. Artinya, KelanaAI membaca langsung dari dokumen panduan travel tepercaya sebelum memberikan jawaban, memastikan tidak ada halusinasi atau informasi palsu.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">AWS Bedrock & Claude</h2>
            <p className="text-slate-600 leading-relaxed">
              Otak di balik aplikasi ini didukung oleh infrastruktur <strong className="text-slate-800">AWS Bedrock</strong> dan ditenagai oleh model cerdas <strong>Amazon Nova Lite v1</strong>.
            </p>
          </div>

        </div>

        {/* Bagian Misi */}
        <div className="bg-blue-600 text-white p-10 md:p-14 rounded-3xl text-center shadow-xl shadow-blue-600/20">
          <h2 className="text-3xl font-bold mb-4">About Developer</h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto mb-1">
            Engineer by training. Developer by passion. Problem solver by nature
          </p>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto mb-2">
            dhiyasalmas
          </p>
          <Link 
            href="/" 
            className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-50 hover:scale-105 transition-all"
          >
            Mulai Rencanakan Trip Sekarang
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} dhiyasalmas</p>
      </footer>
      
    </div>
  );
}