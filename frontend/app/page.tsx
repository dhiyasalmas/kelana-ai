'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function KelanaAIPlanner() {
  // 1. Inisialisasi State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    destination: '',
    days: 1,
    budget: 0,
    hotel_cost: 0,
    transportation_cost: 0,
    food_cost: 0,
    travel_month: 'January'
  });

  // 2. Fungsi untuk menangani perubahan input form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Fungsi Submit ke Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.destination,
          days: Number(formData.days),
          budget: Number(formData.budget),
          hotel_cost: Number(formData.hotel_cost),
          transportation_cost: Number(formData.transportation_cost),
          food_cost: Number(formData.food_cost),
          travel_month: formData.travel_month
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mendapatkan rekomendasi dari server');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* 1. HERO SECTION & DESTINATION IMAGE */}
      <header className="relative w-full h-[35vh] md:h-[45vh] bg-slate-900 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1549473889-14f410d83298?auto=format&fit=crop&w=1920&q=80" 
          alt="Pemandangan Destinasi"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            KelanaAI Travel Planner
          </h1>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md">
            Rencanakan perjalanan impianmu dengan bantuan kecerdasan buatan.
          </p>
        </div>
      </header>

      {/* 2. RESPONSIVE MAIN CONTENT (Grid Layout) */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 -mt-10 md:-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Kolom Kiri: Form Input */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Detail Perjalanan</h2>
            
            {/* Ubah menjadi form dan panggil handleSubmit */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Input Destinasi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Destinasi</label>
                <input 
                  type="text" 
                  name="destination"
                  required
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Contoh: Kota, Negara (Bandung, Indonesia)" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Grid 2 Kolom untuk HP & Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Durasi (Hari)</label>
                  <input 
                    type="number"
                    name="days"
                    min="1"
                    required
                    value={formData.days}
                    onChange={handleChange} 
                    placeholder="Misal: 3" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bulan Perjalanan</label>
                  <select 
                    name="travel_month"
                    value={formData.travel_month}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    <option value="January">Januari</option>
                    <option value="February">Februari</option>
                    <option value="March">Maret</option>
                    <option value="April">April</option>
                    <option value="May">Mei</option>
                    <option value="June">Juni</option>
                    <option value="July">Juli</option>
                    <option value="August">Agustus</option>
                    <option value="September">September</option>
                    <option value="October">Oktober</option>
                    <option value="November">November</option>
                    <option value="December">Desember</option>
                  </select>
                </div>
              </div>

              {/* Input Budget */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget</label>
                <input 
                  type="number"
                  name="budget"
                  min="0"
                  required
                  value={formData.budget}
                  onChange={handleChange} 
                  placeholder="Misal: 5000000" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Box Estimasi Biaya */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Estimasi Biaya Harian:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Hotel/Hari</label>
                    <input type="number" name="hotel_cost" min="0" required value={formData.hotel_cost} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Transport/Hari</label>
                    <input type="number" name="transportation_cost" min="0" required value={formData.transportation_cost} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Makan/Hari</label>
                    <input type="number" name="food_cost" min="0" required value={formData.food_cost} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              {/* Tombol Utama */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? 'AI Sedang Merencanakan...' : 'Buat Rencana Perjalanan'}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Rekomendasi Panel */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col max-h-[800px] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 pb-4 border-b border-slate-100">
              Rekomendasi KelanaAI
            </h2>
            
            {/* Conditional Rendering: Tampilkan hasil jika ada, jika kosong tampilkan Empty State */}
            {result ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-700 font-semibold px-4 py-1.5 rounded-full text-sm">
                    Musim: {result.trip_data?.season || "Tidak diketahui"}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-4 py-1.5 rounded-full text-sm">
                    Gaya: {result.trip_data?.category || "Tidak diketahui"}
                  </span>
                </div>
                
                {/* Render Markdown Hasil AI */}
                <div className="leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  {result.trip_data?.ai_recommendation ? (
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold mt-6 mb-4 text-slate-900" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 border-b border-slate-300 pb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-slate-800" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-6" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-6" {...props} />,
                        li: ({node, ...props}) => <li className="text-slate-700 marker:text-blue-500" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                      }}
                    >
                      {result.trip_data.ai_recommendation}
                    </ReactMarkdown>
                  ) : (
                    "Menunggu rekomendasi AI..."
                  )}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 min-h-[300px]">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 italic text-lg max-w-sm">
                  Silakan isi form di samping untuk melihat hasil rencana perjalananmu.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} KelanaAI. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Tentang Kami</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Bantuan</a>
          </div>
        </div>
      </footer>

    </div>
  );
}