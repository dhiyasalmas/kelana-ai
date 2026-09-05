'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '../../services/authService';
import { getTrips } from '../../services/tripService';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const userData = await getUserProfile();
        setUser(userData);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:p-12 font-sans flex items-start sm:items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-center relative">
          <div className="absolute top-4 left-4">
            <Link href="/" className="text-slate-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
              &larr; Home
            </Link>
          </div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl sm:text-4xl font-extrabold mx-auto mt-4 border-4 border-slate-800 shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-4">{user?.name || 'User'}</h1>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 space-y-5">

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Trips</label>
            <p className="text-xl font-bold text-blue-700 bg-blue-50 px-4 py-4 rounded-xl border border-blue-100 flex items-center gap-3">
              ✈️ {totalTrips} Trip{totalTrips !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <p className="text-base sm:text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 break-words">
              {user?.name}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <p className="text-base sm:text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 break-words">
              {user?.email}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link href="/trips" className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm">
              View Trip History
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 px-4 rounded-xl transition-all text-sm">
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
