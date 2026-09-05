'use client';

import { useState, useEffect } from "react";
import { getTrip } from "../../../services/tripService";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import { useRouter, useParams } from "next/navigation";

const renderItineraryCards = (markdownText: string) => {
  const splitRegex = /(?=(?:^|\n)(?:###|##|#|\*\*)?\s*(?:✈️|🏨|📅|🍽️|💡|💰|Day \d+|Travel Tips|Local Food|Food Recom|Estimated Budget|Budget Break|Conclusion|Transport|Hotel))/i;
  const sections = markdownText.split(splitRegex);

  return sections.map((section, index) => {
    if (!section.trim()) return null;

    const isMainSection = section.match(/(?:^|\n)(?:###|##|#|\*\*)?\s*(?:✈️|🏨|📅|🍽️|💡|💰|Day \d+|Travel Tips|Local Food|Estimated Budget|Transport|Hotel)/i);

    if (index === 0 && !isMainSection) {
      return (
        <div key={index} className="mb-6 px-1">
          <ReactMarkdown
            components={{
              h1: ({...props}) => <h1 className="text-xl sm:text-2xl font-extrabold mb-4 text-slate-900" {...props} />,
              h2: ({...props}) => <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-900 border-b border-slate-200 pb-2" {...props} />,
              h3: ({...props}) => <h3 className="text-base font-bold mb-3 text-slate-800" {...props} />,
              p: ({...props}) => <p className="mb-4 text-slate-600 leading-relaxed text-sm" {...props} />,
            }}
          >
            {section}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div key={index} className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm mb-4 hover:shadow-md transition-shadow">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({...props}) => <h1 className="text-base sm:text-xl font-bold mb-3 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            h2: ({...props}) => <h2 className="text-base sm:text-xl font-bold mb-3 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            h3: ({...props}) => <h3 className="text-sm sm:text-lg font-bold mb-3 text-blue-700 border-b border-blue-100 pb-2" {...props} />,
            ul: ({...props}) => <ul className="list-disc pl-5 space-y-1.5 mb-4" {...props} />,
            li: ({...props}) => <li className="text-slate-700 marker:text-blue-500 text-sm" {...props} />,
            p: ({...props}) => <p className="mb-3 text-slate-700 leading-relaxed text-sm" {...props} />,
            strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
            table: ({...props}) => (
              <div className="overflow-x-auto my-4 rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
              </div>
            ),
            thead: ({...props}) => <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold" {...props} />,
            th: ({...props}) => <th className="px-3 py-2 border-b border-slate-200" {...props} />,
            td: ({...props}) => <td className="px-3 py-2 border-b border-slate-100 text-slate-600" {...props} />,
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
  const params = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const fetchTrip = async () => {
      if (params?.id) {
        try {
          const data = await getTrip(Number(params.id));
          setTrip(data);
        } catch (error) {
          console.error("Failed to fetch trip details", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTrip();
  }, [router, params]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 text-sm">Loading trip details...</p>
      </div>
    );
  }

  if (!trip || trip.detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Access Denied or Not Found</h1>
        <p className="text-slate-500 text-sm mb-6">{trip?.detail || "Trip data is unavailable."}</p>
        <Link href="/trips" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition">
          &larr; Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5">

        <Link href="/trips" className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
          &larr; Back to My Trips
        </Link>

        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-5">

          {/* Header */}
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
              Trip #{trip.id}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{trip.destination}</h1>

            {/* Info badges — wrap nicely on mobile */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1">🗓 <strong>{trip.days} day{trip.days !== 1 ? 's' : ''}</strong></span>
              {trip.travel_month && (
                <span className="flex items-center gap-1">📅 <strong>{trip.travel_month}{trip.travel_year ? ` ${trip.travel_year}` : ''}</strong></span>
              )}
              {trip.budget && <span className="flex items-center gap-1">💰 <strong>{trip.budget?.toLocaleString()}</strong></span>}
              {trip.category && <span className="flex items-center gap-1">🎒 <strong>{trip.category}</strong></span>}
              {trip.travel_style && <span className="flex items-center gap-1">👥 <strong>{trip.travel_style}</strong></span>}
              {trip.season && <span className="flex items-center gap-1">🌤 <strong>{trip.season}</strong></span>}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">AI Travel Plan</h2>
            {trip.ai_recommendation ? (
              <div className="mt-2">{renderItineraryCards(trip.ai_recommendation)}</div>
            ) : (
              <p className="text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm">
                No AI recommendation saved for this trip.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
