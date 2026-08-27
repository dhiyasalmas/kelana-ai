'use client';

import { useState, useEffect } from "react";
import { getTrips } from "../../services/tripService";
import { TripCard } from "../../components/TripCard";
import Link from "next/link";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States untuk Search, Sort, dan Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Batas item per halaman

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await getTrips();
        setTrips(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal mengambil data trip:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Kembalikan ke halaman 1 jika user melakukan pencarian atau mengubah urutan
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  // 1. Jalankan Filter & Sort
  const filteredAndSortedTrips = trips
    .filter((trip) => 
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "latest") return b.id - a.id;
      if (sortOption === "oldest") return a.id - b.id;
      if (sortOption === "highest_budget") return b.budget - a.budget;
      return 0;
    });

  // 2. Jalankan Paginasi (Potong array berdasarkan halaman saat ini)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrips = filteredAndSortedTrips.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedTrips.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Riwayat Perjalanan</h1>
            <p className="text-slate-500 text-sm mt-1">Daftar trip tersimpan ({filteredAndSortedTrips.length} Trip)</p>
          </div>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm text-center">
            + Buat Trip Baru
          </Link>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari destinasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-slate-700"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer transition-all text-sm text-slate-700"
            >
              <option value="latest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest_budget">Budget Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Render Cards */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Memuat data perjalanan...</p>
          </div>
        ) : currentTrips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {currentTrips.map((t: any) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
            
            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8 pt-4">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-slate-600 font-medium px-4">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 mt-6">
            <p className="text-slate-500">
              {searchQuery ? "Tidak ada trip yang sesuai dengan pencarianmu." : "Belum ada data trip yang tersimpan."}
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}