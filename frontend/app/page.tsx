'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Tipe data untuk daftar chat di sidebar
type Conversation = {
  id: number;
  title: string;
  created_at: string;
};

// Tipe data untuk pesan
type Message = {
  id?: number;
  role: 'user' | 'assistant' | 'ai'; 
  content: string;
  sources?: string[];
  created_at?: string;
};

// --- HELPER: Format angka ke string dengan titik sebagai pemisah ribuan ---
function formatNumber(val: number | string): string {
  const num = typeof val === 'string' ? val.replace(/\./g, '') : String(val);
  if (!num || num === '0') return '';
  return Number(num).toLocaleString('id-ID');
}

// --- HELPER: Parse string berformat (hapus titik) ke angka ---
function parseNumber(val: string): number {
  const cleaned = val.replace(/\./g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const MAX_BUDGET = 1_000_000_000;
const CURRENT_YEAR = new Date().getFullYear();

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
    travel_year: CURRENT_YEAR,
    travel_style: 'Solo',
  });

  // Nilai tampilan terformat (string dengan titik ribuan)
  const [displayValues, setDisplayValues] = useState({
    budget: '',
    hotel_cost: '',
    transportation_cost: '',
    food_cost: '',
  });

  // --- STATE TABS ---
  const [activeTab, setActiveTab] = useState<'result' | 'chat' | 'base_model'>('result');

  // ==========================================
  // STATE CHAT 1: KNOWLEDGE BASE (RAG) + MEMORY
  // ==========================================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // STATE CHAT 2: BASE MODEL
  // ==========================================
  const [baseQuery, setBaseQuery] = useState('');
  const [baseMessages, setBaseMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Halo! Aku **Base Model Murni**. Aku menjawab menggunakan pengetahuan umum bawaanku tanpa melihat dokumenmu. Mari kita bandingkan jawabanku!', 
      sources: [],
      created_at: new Date().toISOString()
    }
  ]);
  const [isBaseLoading, setIsBaseLoading] = useState(false);
  const baseMessagesEndRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // USE EFFECTS
  // ------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setIsChecking(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'chat') {
      fetchConversations();
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([{ 
        role: 'assistant', 
        content: 'Silakan pilih riwayat obrolan di samping, atau klik **+ New Chat** untuk memulai percakapan baru.', 
        sources: [],
        created_at: new Date().toISOString()
      }]);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

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

  // ------------------------------------------
  // HELPER FORMAT WAKTU
  // ------------------------------------------
  const formatTime = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // ------------------------------------------
  // HANDLER FORM: field biasa
  // ------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ------------------------------------------
  // HANDLER FORM: field currency (budget, hotel_cost, dst)
  // ------------------------------------------
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Hapus karakter non-digit
    const raw = value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);

    // Validasi max budget hanya untuk field 'budget'
    if (name === 'budget' && num > MAX_BUDGET) {
      setError(`Budget maksimal adalah Rp ${formatNumber(MAX_BUDGET)}`);
      return;
    }
    if (name === 'budget') setError('');

    setFormData(prev => ({ ...prev, [name]: num }));
    setDisplayValues(prev => ({ ...prev, [name]: raw === '' ? '' : Number(raw).toLocaleString('id-ID') }));
  };

  // ------------------------------------------
  // API CALLS: CHAT HISTORY (RAG)
  // ------------------------------------------
  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConvId) setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat daftar obrolan:", err);
    }
  };

  const createNewChat = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: "New Chat" })
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([{ 
          role: 'assistant', 
          content: 'Halo! Aku KelanaAI (RAG). Ruang obrolan baru telah dibuat. Apa yang ingin kamu tanyakan hari ini?', 
          sources: [],
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error("Gagal membuat obrolan baru:", err);
    }
  };

  const fetchMessages = async (convId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        const data = await res.json();
        setMessages(data.length === 0
          ? [{ role: 'assistant', content: 'Obrolan ini masih kosong. Silakan mulai bertanya.', sources: [], created_at: new Date().toISOString() }]
          : data
        );
      }
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    }
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !activeConvId) return;
    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    setQuery('');
    setIsAskLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: userMessage })
      });
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Gagal menghubungi AI Server');
      }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources, created_at: new Date().toISOString() }]);
      if (conversations.find(c => c.id === activeConvId)?.title === "New Chat") fetchConversations();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setMessages(prev => [...prev, { role: 'assistant', content: `*Maaf, terjadi kesalahan: ${msg}*`, created_at: new Date().toISOString() }]);
    } finally {
      setIsAskLoading(false);
    }
  };

  // ------------------------------------------
  // SUBMIT TRIP PLANNER
  // ------------------------------------------
  const handlePlannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi budget sebelum submit
    if (formData.budget > MAX_BUDGET) {
      setError(`Budget maksimal adalah Rp ${formatNumber(MAX_BUDGET)}`);
      return;
    }
    if (formData.budget <= 0) {
      setError('Budget harus lebih dari 0');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab('result');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          destination: formData.destination,
          days: Number(formData.days),
          budget: Number(formData.budget),
          hotel_cost: Number(formData.hotel_cost),
          transportation_cost: Number(formData.transportation_cost),
          food_cost: Number(formData.food_cost),
          travel_month: formData.travel_month,
          travel_year: Number(formData.travel_year),
          travel_style: formData.travel_style,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mendapatkan rekomendasi dari server');
      }
      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // SUBMIT BASE MODEL
  // ------------------------------------------
  const handleBaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseQuery.trim()) return;
    const userMessage = baseQuery;
    setBaseMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    setBaseQuery('');
    setIsBaseLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask-base-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: userMessage })
      });
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Gagal menghubungi Base Model Server');
      }
      const data = await response.json();
      setBaseMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources, created_at: new Date().toISOString() }]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setBaseMessages(prev => [...prev, { role: 'assistant', content: `*Maaf, terjadi kesalahan: ${msg}*`, created_at: new Date().toISOString() }]);
    } finally {
      setIsBaseLoading(false);
    }
  };

  // --- RENDER ITINERARY CARDS ---
  const renderItineraryCards = (markdownText: string) => {
    const splitRegex = /(?=(?:^|\n)(?:###|##|#|\*\*)?\s*(?:âœˆï¸|ðŸ¨|ðŸ“…|ðŸ½ï¸|ðŸ’¡|ðŸ’°|Day \d+|Travel Tips|Local Food|Food Recom|Estimated Budget|Budget Break|Conclusion|Transport|Hotel))/i;
    const sections = markdownText.split(splitRegex);

    return sections.map((section, index) => {
      if (!section.trim()) return null;
      const isMainSection = section.match(/(?:^|\n)(?:###|##|#|\*\*)?\s*(?:âœˆï¸|ðŸ¨|ðŸ“…|ðŸ½ï¸|ðŸ’¡|ðŸ’°|Day \d+|Travel Tips|Local Food|Estimated Budget|Transport|Hotel)/i);

      if (index === 0 && !isMainSection) {
        return (
          <div key={index} className="mb-6 px-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h1: ({...props}) => <h1 className="text-2xl font-extrabold mb-4 text-slate-900" {...props} />,
              h2: ({...props}) => <h2 className="text-xl font-bold mb-4 text-slate-900 border-b border-slate-200 pb-2" {...props} />,
              h3: ({...props}) => <h3 className="text-lg font-bold mb-3 text-slate-800" {...props} />,
              p: ({...props}) => <p className="mb-4 text-slate-600 leading-relaxed text-sm" {...props} />,
            }}>{section}</ReactMarkdown>
          </div>
        );
      }

      return (
        <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm mb-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({...props}) => <h1 className="text-xl font-bold mb-4 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            h2: ({...props}) => <h2 className="text-xl font-bold mb-4 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            h3: ({...props}) => <h3 className="text-lg font-bold mb-3 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            ul: ({...props}) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
            li: ({...props}) => <li className="text-slate-700 marker:text-blue-500 text-sm" {...props} />,
            p: ({...props}) => <p className="mb-3 text-slate-700 leading-relaxed text-sm" {...props} />,
            strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
            table: ({...props}) => (
              <div className="overflow-x-auto my-6 rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({...props}) => <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold" {...props} />,
            th: ({...props}) => <th className="px-4 py-3 border-b border-slate-200" {...props} />,
            td: ({...props}) => <td className="px-4 py-3 border-b border-slate-100 text-slate-600" {...props} />,
          }}>{section}</ReactMarkdown>
        </div>
      );
    });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-slate-300 font-medium text-sm">Memeriksa akses...</p>
      </div>
    );
  }

  // Tahun pilihan: tahun ini sampai 5 tahun ke depan
  const yearOptions = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">

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
              <Link href="/trips" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg text-sm">
                Lihat Daftar Perjalananku &rarr;
              </Link>
              <Link href="/about" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-6 py-3 rounded-full transition-all text-sm">
                Tentang AI Kami
              </Link>
              <Link href="/profile" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3 rounded-full transition-all text-sm">
                Profil
              </Link>
              <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm border border-red-500/50 text-white font-semibold px-8 py-3 rounded-full transition-all text-sm">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-full transition-all shadow-lg text-sm">Login</Link>
              <Link href="/register" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-white font-semibold px-10 py-3 rounded-full transition-all text-sm">Daftar Akun</Link>
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

              {/* Destinasi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Destinasi</label>
                <input
                  type="text" name="destination" required
                  value={formData.destination} onChange={handleChange}
                  placeholder="Contoh: Tokyo, Japan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
              </div>

              {/* Durasi + Bulan + Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Durasi (Hari)</label>
                  <input
                    type="number" name="days" min="1" required
                    value={formData.days} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bulan</label>
                  <select name="travel_month" value={formData.travel_month} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-sm">
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun</label>
                  <select name="travel_year" value={formData.travel_year} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-sm">
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Budget */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Total Budget
                  <span className="ml-2 text-xs font-normal text-slate-400">(maks. Rp 1.000.000.000)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                  <input
                    type="text"
                    name="budget"
                    required
                    inputMode="numeric"
                    value={displayValues.budget}
                    onChange={handleCurrencyChange}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                </div>
                {formData.budget > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    = Rp {formData.budget.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Estimasi Biaya Harian */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Estimasi Biaya Harian:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {([
                    { name: 'hotel_cost', label: 'Hotel/Hari' },
                    { name: 'transportation_cost', label: 'Transport/Hari' },
                    { name: 'food_cost', label: 'Makan/Hari' },
                  ] as { name: keyof typeof displayValues; label: string }[]).map(({ name, label }) => (
                    <div key={name}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rp</span>
                        <input
                          type="text"
                          name={name}
                          required
                          inputMode="numeric"
                          value={displayValues[name]}
                          onChange={handleCurrencyChange}
                          placeholder="0"
                          className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaya Perjalanan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gaya Perjalanan</label>
                <select name="travel_style" value={formData.travel_style} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-sm">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md mt-4 disabled:opacity-50 text-sm"
              >
                {loading ? 'AI Sedang Merencanakan...' : 'Buat Rencana Perjalanan âœˆï¸'}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: TAB REKOMENDASI, CHAT RAG, CHAT BASE MODEL */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col max-h-[800px] overflow-hidden">

              {/* Tab Header */}
              <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-4 mb-4">
                <button onClick={() => setActiveTab('result')} className={`text-sm md:text-base font-bold transition-colors ${activeTab === 'result' ? 'text-blue-600 border-b-2 border-blue-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}>
                  Rekomendasi Trip
                </button>
                <button onClick={() => setActiveTab('chat')} className={`text-sm md:text-base font-bold transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'text-emerald-600 border-b-2 border-emerald-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}>
                  ðŸ’¬ Tanya AI (RAG)
                </button>
                <button onClick={() => setActiveTab('base_model')} className={`text-sm md:text-base font-bold transition-colors flex items-center gap-2 ${activeTab === 'base_model' ? 'text-violet-600 border-b-2 border-violet-600 pb-2' : 'text-slate-400 hover:text-slate-600'}`}>
                  ðŸ¤– Base Model
                </button>
              </div>

              {/* Tab: Hasil Trip */}
              {activeTab === 'result' && (
                <div className="overflow-y-auto flex-grow pr-2">
                  {result ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="bg-blue-100 text-blue-700 font-semibold px-4 py-1.5 rounded-full text-xs">Musim: {result.trip_data?.season || "â€”"}</span>
                        <span className="bg-emerald-100 text-emerald-700 font-semibold px-4 py-1.5 rounded-full text-xs">Gaya: {result.trip_data?.category || "â€”"}</span>
                        <span className="bg-violet-100 text-violet-700 font-semibold px-4 py-1.5 rounded-full text-xs">
                          {result.trip_data?.travel_month || ""} {result.trip_data?.travel_year || ""}
                        </span>
                      </div>
                      <div className="mt-2">
                        {result.trip_data?.ai_recommendation
                          ? renderItineraryCards(result.trip_data.ai_recommendation)
                          : <p className="text-sm text-slate-400 italic">Menunggu rekomendasi AI...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 h-full min-h-[300px]">
                      <p className="text-slate-500 italic text-base max-w-sm">Silakan isi form di samping untuk melihat hasil rencana perjalananmu.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Chat RAG */}
              {activeTab === 'chat' && (
                <div className="flex h-full flex-grow overflow-hidden min-h-[500px] border border-slate-200 rounded-xl">
                  <div className="w-1/3 md:w-1/4 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-3 border-b border-slate-200 bg-white">
                      <button onClick={createNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-lg text-xs transition shadow-sm">
                        + New Chat
                      </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                      {conversations.map(c => (
                        <div key={c.id} onClick={() => setActiveConvId(c.id)} className={`p-3 cursor-pointer border-b border-slate-100 transition-colors ${activeConvId === c.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-slate-100'}`}>
                          <p className={`text-xs font-bold truncate ${activeConvId === c.id ? 'text-emerald-800' : 'text-slate-700'}`}>{c.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      ))}
                      {conversations.length === 0 && <p className="text-xs text-slate-400 text-center p-4 italic">Belum ada obrolan.</p>}
                    </div>
                  </div>
                  <div className="w-2/3 md:w-3/4 flex flex-col bg-white">
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
                      {messages.map((msg, index) => (
                        <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[95%] p-3 md:p-4 rounded-xl shadow-sm flex flex-col ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                            {msg.role === 'assistant' || msg.role === 'ai' ? (
                              <div className="flex flex-col gap-2">
                                <div className="text-sm">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    h1: ({...props}) => <h1 className="text-base font-bold mb-2 text-emerald-800" {...props} />,
                                    h2: ({...props}) => <h2 className="text-sm font-bold mb-2 text-emerald-800" {...props} />,
                                    h3: ({...props}) => <h3 className="text-sm font-bold mb-2 text-emerald-800" {...props} />,
                                    ul: ({...props}) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                    ol: ({...props}) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                                    li: ({...props}) => <li className="text-slate-700 marker:text-emerald-500 text-sm" {...props} />,
                                    p: ({...props}) => <p className="mb-3 text-slate-700 leading-relaxed last:mb-0 text-sm" {...props} />,
                                    strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                  }}>{msg.content}</ReactMarkdown>
                                </div>
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ðŸ“– Sumber Referensi:</p>
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
                            <div className={`text-[10px] text-right mt-2 font-medium ${msg.role === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      ))}
                      {isAskLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 p-4 rounded-xl rounded-tl-none shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                      <form onSubmit={handleAskSubmit} className="flex gap-2">
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={activeConvId ? "Ketik pesan..." : "Buat / pilih chat dulu..."} className="flex-grow px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none text-sm transition" disabled={isAskLoading || !activeConvId} />
                        <button type="submit" disabled={isAskLoading || !query.trim() || !activeConvId} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50 text-sm">Kirim</button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Base Model */}
              {activeTab === 'base_model' && (
                <div className="flex flex-col h-full flex-grow overflow-hidden min-h-[500px]">
                  <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    {baseMessages.map((msg, index) => (
                      <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[95%] p-4 rounded-2xl shadow-sm flex flex-col ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                          {msg.role === 'assistant' || msg.role === 'ai' ? (
                            <div className="text-sm">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                h1: ({...props}) => <h1 className="text-base font-bold mb-2 text-violet-800" {...props} />,
                                h2: ({...props}) => <h2 className="text-sm font-bold mb-2 text-violet-800" {...props} />,
                                h3: ({...props}) => <h3 className="text-sm font-bold mb-2 text-violet-800" {...props} />,
                                ul: ({...props}) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                ol: ({...props}) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                                li: ({...props}) => <li className="text-slate-700 marker:text-violet-500 text-sm" {...props} />,
                                p: ({...props}) => <p className="mb-3 text-slate-700 leading-relaxed last:mb-0 text-sm" {...props} />,
                                strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
                              }}>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                          <div className={`text-[10px] text-right mt-2 font-medium ${msg.role === 'user' ? 'text-violet-200' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</div>
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
                      <input type="text" value={baseQuery} onChange={(e) => setBaseQuery(e.target.value)} placeholder="Tanya langsung ke Base Model AI..." className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 outline-none text-sm transition" disabled={isBaseLoading} />
                      <button type="submit" disabled={isBaseLoading || !baseQuery.trim()} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm">Kirim</button>
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

