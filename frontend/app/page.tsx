'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";

export default function KelanaAIPlanner() {
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
    travel_month: 'January',
    travel_style: 'Solo'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.destination,
          days: Number(formData.days),
          budget: Number(formData.budget),
          hotel_cost: Number(formData.hotel_cost),
          transportation_cost: Number(formData.transportation_cost),
          food_cost: Number(formData.food_cost),
          travel_month: formData.travel_month,
          travel_style: formData.travel_style
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

  const renderItineraryCards = (markdownText: string) => {
    const sections = markdownText.split(/(?=(?:^|\n)(?:###|##|#|\*\*)?\s*Day \d+)/i);
    return sections.map((section, index) => {
      if (!section.trim()) return null;

      // Bagian Intro / Judul (Sebelum hari pertama)
      if (index === 0 && !section.match(/Day \d+/i)) {
        return (
          <div key={index} className="mb-6 px-2">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-extrabold mb-4 text-slate-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-4 text-slate-900 border-b border-slate-200 pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-3 text-slate-800" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 text-slate-600 leading-relaxed" {...props} />,
              }}
            >
              {section}
            </ReactMarkdown>
          </div>
        );
      }

      // KARTU CONTAINER: Untuk setiap hari (Day 1, Day 2, dst)
      return (
        <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm mb-5 hover:shadow-md transition-shadow">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]} 
            components={{
              h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-4 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-4 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-3 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="text-slate-700 marker:text-blue-500" {...props} />,
              p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
              
              // --- TAMBAHKAN STYLING TABEL DI BAWAH INI ---
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-6 rounded-lg border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-3 border-b border-slate-200" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 border-b border-slate-100 text-slate-600" {...props} />,
            }}
          >
            {section}
        </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* 1. HERO SECTION */}
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
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md mb-6">
            Rencanakan perjalanan impianmu dengan bantuan kecerdasan buatan.
          </p>
          <a 
            href="/trips" 
            className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-white font-semibold px-6 py-2.5 rounded-full transition-all"
          >
            Lihat Daftar Perjalananku &rarr;
          </a>
        </div>
      </header>

      {/* 2. RESPONSIVE MAIN CONTENT (Grid Layout) */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 -mt-10 md:-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Kolom Kiri: Form Input */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Detail Perjalanan</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget</label>
                <input 
                  type="number"
                  name="budget"
                  min="0"
                  required
                  value={formData.budget}
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>

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

              {/* Input Gaya Perjalanan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gaya Perjalanan</label>
                <select 
                  name="travel_style"
                  value={formData.travel_style}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="Solo">Solo (Sendirian)</option>
                  <option value="Couple">Couple (Pasangan)</option>
                  <option value="Family">Family (Keluarga)</option>
                  <option value="Friends">Friends (Bersama Teman)</option>
                </select>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg mt-4 disabled:opacity-50"
              >
                {loading ? 'AI Sedang Merencanakan...' : 'Buat Rencana Perjalanan'}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Rekomendasi Panel */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col max-h-[850px] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 pb-4 border-b border-slate-100">
              Rekomendasi KelanaAI
            </h2>
            
            {result ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-700 font-semibold px-4 py-1.5 rounded-full text-sm">
                    Musim: {result.trip_data?.season || "Tidak diketahui"}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-4 py-1.5 rounded-full text-sm">
                    Gaya: {result.trip_data?.category || "Tidak diketahui"}
                  </span>
                </div>
                
                {/* PEMANGGILAN FUNGSI KARTU DI SINI */}
                <div className="mt-2">
                  {result.trip_data?.ai_recommendation ? (
                    renderItineraryCards(result.trip_data.ai_recommendation)
                  ) : (
                    "Menunggu rekomendasi AI..."
                  )}
                </div>
              </div>
            ) : (
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
    </div>
  );
}