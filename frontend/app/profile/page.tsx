'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '../../services/authService';
import { getTrips } from '../../services/tripService'; // 1. Import fungsi pengambil trip

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [totalTrips, setTotalTrips] = useState<number>(0); // 2. State untuk menyimpan jumlah trip
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Penjaga Pintu & Pemanggil Data Gabungan
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Ambil data profil
        const userData = await getUserProfile();
        setUser(userData);

        // Ambil data trip dan hitung jumlahnya
        const tripsData = await getTrips();
        setTotalTrips(Array.isArray(tripsData) ? tripsData.length : 0);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* Header Profil */}
        <div className="bg-slate-900 px-6 py-8 text-center relative">
          <div className="absolute top-4 left-4">
            <Link href="/" className="text-slate-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
              &larr; Beranda
            </Link>
          </div>
          
          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl font-extrabold mx-auto mt-4 border-4 border-slate-800 shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">{user?.name || 'Pengguna'}</h1>
        </div>

        {/* Info Detail */}
        <div className="p-8 space-y-6">
          
          {/* STATISTIK TRIP BARU */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Trip Dibuat</label>
            <p className="text-xl font-bold text-blue-700 bg-blue-50 px-4 py-4 rounded-xl border border-blue-100 flex items-center gap-3">
              ✈️ {totalTrips} Perjalanan
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <p className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              {user?.name}
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</label>
            <p className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              {user?.email}
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Link href="/trips" className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all">
              Lihat Riwayat Perjalanan
            </Link>
            
            <button onClick={handleLogout} className="w-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 px-4 rounded-xl transition-all">
              Keluar (Logout)
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}