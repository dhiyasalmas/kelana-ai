'use client';

import { useState, useEffect } from "react";
import { getTrip } from "../../../services/tripService";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import { useRouter, useParams } from "next/navigation"; 

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

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams(); // Mengambil ID dari URL dengan cara Client Component
  
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // PENJAGA HALAMAN & PEMANGGIL DATA
  useEffect(() => {
    // 1. Cek KTP (Token)
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return; // Berhenti mengeksekusi kode di bawahnya jika tidak ada token
    }

    // 2. Jika aman, panggil data trip dari backend
    const fetchTrip = async () => {
      if (params?.id) {
        try {
          const data = await getTrip(Number(params.id));
          setTrip(data);
        } catch (error) {
          console.error("Gagal mengambil detail trip", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTrip();
  }, [router, params]);

  // Tampilan saat data sedang diambil (Loading)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500">Memuat detail perjalanan...</p>
      </div>
    );
  }

  // Tampilan jika trip tidak ditemukan atau dilarang diakses (Forbidden 403)
  if (!trip || trip.detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak atau Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-6">{trip?.detail || "Data trip tidak tersedia."}</p>
        <Link href="/trips" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition">
          &larr; Kembali ke daftar trip
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/trips" className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
          &larr; Kembali ke Daftar Trip
        </Link>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          
          {/* Header Detail Perjalanan */}
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
              Detail Trip #{trip.id}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-3">{trip.destination}</h1>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1">🗓 <strong>{trip.days} Hari</strong></span>
              <span className="flex items-center gap-1">💰 <strong>Rp {trip.budget?.toLocaleString()}</strong></span>
              {trip.category && <span className="flex items-center gap-1">🎒 <strong>{trip.category}</strong></span>}
              {trip.travel_style && <span className="flex items-center gap-1">👥 <strong>{trip.travel_style}</strong></span>}
              {trip.season && <span className="flex items-center gap-1">🌤 <strong>{trip.season}</strong></span>}
            </div>
          </div>

          {/* Bagian Hasil AI dengan Container Terpisah */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Rekomendasi Rencana Perjalanan AI</h2>
            
            {trip.ai_recommendation ? (
              <div className="mt-2">
                {renderItineraryCards(trip.ai_recommendation)}
              </div>
            ) : (
              <p className="text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-slate-200">
                Tidak ada rekomendasi tersimpan untuk trip ini.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}