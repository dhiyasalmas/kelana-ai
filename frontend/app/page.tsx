'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function KelanaAIPlanner() {
  const router = useRouter();
  
  // --- STATE AUTENTIKASI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // --- STATE TRIP PLANNER ---
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

  // --- STATE KOLOM KANAN (TABS) ---
  // Menambahkan 'base_model' sebagai opsi tab
  const [activeTab, setActiveTab] = useState<'result' | 'chat' | 'base_model'>('result');

  // ==========================================
  // STATE CHAT 1: KNOWLEDGE BASE (RAG)
  // ==========================================
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, sources?: string[]}[]>([
    { role: 'ai', content: 'Halo! Aku **KelanaAI (RAG)**. Jawabanku dijamin akurat karena aku membaca langsung dari dokumen yang kamu unggah. Tanyakan saja padaku!', sources: [] }
  ]);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // STATE CHAT 2: BASE MODEL (TANPA DOKUMEN)
  // ==========================================
  const [baseQuery, setBaseQuery] = useState('');
  const [baseMessages, setBaseMessages] = useState<{role: 'user' | 'ai', content: string, sources?: string[]}[]>([
    { role: 'ai', content: 'Halo! Aku **Base Model Murni**. Aku menjawab menggunakan pengetahuan umum bawaanku tanpa melihat dokumenmu. Mari kita bandingkan jawabanku!', sources: [] }
  ]);
  const [isBaseLoading, setIsBaseLoading] = useState(false);
  const baseMessagesEndRef = useRef<HTMLDivElement>(null);


  // PENJAGA PINTU
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setIsChecking(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  // SCROLL OTOMATIS UNTUK CHAT RAG
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // SCROLL OTOMATIS UNTUK CHAT BASE MODEL
  useEffect(() => {
    if (activeTab === 'base_model') {
      baseMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [baseMessages, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/login'); 
  };

  // --- FUNGSI SUBMIT TRIP PLANNER ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab('result'); 

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

      if (!response.ok) throw new Error('Gagal mendapatkan rekomendasi dari server');

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI SUBMIT CHAT 1: ASK AI (RAG) ---
  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setIsAskLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: userMessage })
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error('Gagal menghubungi AI Server');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer, sources: data.sources }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `*Maaf, terjadi kesalahan: ${error.message}*` }]);
    } finally {
      setIsAskLoading(false);
    }
  };

  // --- FUNGSI SUBMIT CHAT 2: BASE MODEL ---
  const handleBaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseQuery.trim()) return;

    const userMessage = baseQuery;
    setBaseMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setBaseQuery('');
    setIsBaseLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Memanggil endpoint khusus base model yang baru saja kita buat di main.py
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask-base-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: userMessage })
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error('Gagal menghubungi Base Model Server');

      const data = await response.json();
      setBaseMessages(prev => [...prev, { role: 'ai', content: data.answer, sources: data.sources }]);
    } catch (error: any) {
      setBaseMessages(prev => [...prev, { role: 'ai', content: `*Maaf, terjadi kesalahan: ${error.message}*` }]);
    } finally {
      setIsBaseLoading(false);
    }
  };

  // --- KOMPONEN RENDER MARKDOWN TRIP ---
  const renderItineraryCards = (markdownText: string) => {
    const splitRegex = /(?=(?:^|\n)(?:###|##|#|\*\*)?\s*(?:Day \d+|Travel Tips|Local Food|Food Recom|Estimated Budget|Budget Break|Conclusion))/i;
    const sections = markdownText.split(splitRegex);

    return sections.map((section, index) => {
      if (!section.trim()) return null;

      const isMainSection = section.match(/(?:^|\n)(?:###|##|#|\*\*)?\s*(?:Day \d+|Travel Tips|Local Food|Food Recom|Estimated Budget|Budget Break|Conclusion)/i);

      if (index === 0 && !isMainSection) {
        return (
          <div key={index} className="mb-6 px-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
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

      return (
        <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm mb-5">
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

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-slate-300 font-medium">Memeriksa akses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* HEADER HERO */}
      <header className="relative w-full h-[35vh] md:h-[45vh] bg-slate-900 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1549473889-14f410d83298?auto=format&fit=crop&w=1920&q=80" 
          alt="Pemandangan Destinasi"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 text-center px-4 mt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            KelanaAI Travel Planner
          </h1>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md mb-8">
            Rencanakan perjalanan impianmu dengan bantuan kecerdasan buatan.
          </p>
          
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/trips" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg">
                Lihat Daftar Perjalananku &rarr;
              </Link>
              <Link href="/profile" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3 rounded-full transition-all">
                Profil
              </Link>
              <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm border border-red-500/50 text-white font-semibold px-8 py-3 rounded-full transition-all">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-full transition-all shadow-lg">Login</Link>
              <Link href="/register" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-white font-semibold px-10 py-3 rounded-full transition-all">Daftar Akun</Link>
            </div>
          )}
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 -mt-10 md:-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: FORM TRIP PLANNER */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 h-fit">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Detail Perjalanan</h2>
            <form onSubmit={handlePlannerSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Destinasi</label>
                <input type="text" name="destination" required value={formData.destination} onChange={handleChange} placeholder="Contoh: Kota, Negara (Bandung, Indonesia)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Durasi (Hari)</label>
                  <input type="number" name="days" min="1" required value={formData.days} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bulan Perjalanan</label>
                  <select name="travel_month" value={formData.travel_month} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer">
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget</label>
                <input type="number" name="budget" min="0" required value={formData.budget} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gaya Perjalanan</label>
                <select name="travel_style" value={formData.travel_style} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer">
                  <option value="Solo">Solo (Sendirian)</option>
                  <option value="Couple">Couple (Pasangan)</option>
                  <option value="Family">Family (Keluarga)</option>
                  <option value="Friends">Friends (Bersama Teman)</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md mt-4 disabled:opacity-50">
                {loading ? 'AI Sedang Merencanakan...' : 'Buat Rencana Perjalanan'}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: TAB REKOMENDASI, CHAT RAG, & CHAT BASE MODEL */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* 1. KOTAK HASIL TRIP */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col max-h-[600px] overflow-y-auto">
              {/* Bagian Tab di Dalam Kotak Hasil */}
              <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-4 mb-4">
                <button 
                  onClick={() => setActiveTab('result')}
                  className={`text-base md:text-lg font-bold transition-colors ${activeTab === 'result' ? 'text-blue-600 border-b-2 border-blue-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Rekomendasi Trip
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`text-base md:text-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'text-emerald-600 border-b-2 border-emerald-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  💬 Tanya AI (RAG)
                </button>
                <button 
                  onClick={() => setActiveTab('base_model')}
                  className={`text-base md:text-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'base_model' ? 'text-violet-600 border-b-2 border-violet-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  🤖 Base Model
                </button>
              </div>

              {/* KONTEN TAB: HASIL TRIP */}
              {activeTab === 'result' && (
                <div className="overflow-y-auto flex-grow pr-2">
                  {result ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="bg-blue-100 text-blue-700 font-semibold px-4 py-1.5 rounded-full text-sm">Musim: {result.trip_data?.season || "Tidak diketahui"}</span>
                        <span className="bg-emerald-100 text-emerald-700 font-semibold px-4 py-1.5 rounded-full text-sm">Gaya: {result.trip_data?.category || "Tidak diketahui"}</span>
                      </div>
                      <div className="mt-2">
                        {result.trip_data?.ai_recommendation ? renderItineraryCards(result.trip_data.ai_recommendation) : "Menunggu rekomendasi AI..."}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 h-full min-h-[300px]">
                      <p className="text-slate-500 italic text-lg max-w-sm">Silakan isi form di samping untuk melihat hasil rencana perjalananmu.</p>
                    </div>
                  )}
                </div>
              )}

              {/* KONTEN TAB: CHAT Q&A (RAG) - WARNA EMERALD */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full flex-grow overflow-hidden min-h-[400px]">
                  <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[95%] p-4 rounded-2xl shadow-sm flex flex-col ${
                          msg.role === 'user' 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {msg.role === 'ai' ? (
                            <div className="flex flex-col gap-2">
                              <div className="text-sm">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-emerald-800" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-emerald-800" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 text-emerald-800" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                                    li: ({node, ...props}) => <li className="text-slate-700 marker:text-emerald-500" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed last:mb-0" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📖 Sumber Referensi:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.sources.map((src, idx) => (
                                      <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] px-2 py-1 rounded-md">{src}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAskLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="pt-4 mt-auto">
                    <form onSubmit={handleAskSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tanya menggunakan dokumen (RAG)..."
                        className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none text-sm transition"
                        disabled={isAskLoading}
                      />
                      <button
                        type="submit"
                        disabled={isAskLoading || !query.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm"
                      >
                        Kirim
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* KONTEN TAB: CHAT BASE MODEL - WARNA VIOLET */}
              {activeTab === 'base_model' && (
                <div className="flex flex-col h-full flex-grow overflow-hidden min-h-[400px]">
                  <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    {baseMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[95%] p-4 rounded-2xl shadow-sm flex flex-col ${
                          msg.role === 'user' 
                            ? 'bg-violet-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {msg.role === 'ai' ? (
                            <div className="flex flex-col gap-2">
                              <div className="text-sm">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-violet-800" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-violet-800" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 text-violet-800" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                                    li: ({node, ...props}) => <li className="text-slate-700 marker:text-violet-500" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed last:mb-0" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📖 Sumber Referensi:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.sources.map((src, idx) => (
                                      <span key={idx} className="bg-violet-50 text-violet-700 border border-violet-100 text-[11px] px-2 py-1 rounded-md">{src}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isBaseLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    )}
                    <div ref={baseMessagesEndRef} />
                  </div>
                  <div className="pt-4 mt-auto">
                    <form onSubmit={handleBaseSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={baseQuery}
                        onChange={(e) => setBaseQuery(e.target.value)}
                        placeholder="Tanya langsung ke Base Model AI..."
                        className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 outline-none text-sm transition"
                        disabled={isBaseLoading}
                      />
                      <button
                        type="submit"
                        disabled={isBaseLoading || !baseQuery.trim()}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm"
                      >
                        Kirim
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}