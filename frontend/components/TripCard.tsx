import Link from 'next/link';

interface TripProps {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category?: string;
  travel_style?: string;
  season?: string;
}

const getCategoryBadgeStyle = (category?: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('luxury')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (cat.includes('backpacker')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
};

const getDestinationIcon = (dest: string) => {
  const d = dest.toLowerCase();
  const flagMap: Record<string, string> = {
    'indonesia': '🇮🇩', 'bali': '🇮🇩', 'jakarta': '🇮🇩', 'bandung': '🇮🇩',
    'japan': '🇯🇵', 'tokyo': '🇯🇵',
    'korea': '🇰🇷', 'seoul': '🇰🇷',
    'singapore': '🇸🇬',
    'malaysia': '🇲🇾', 'kuala lumpur': '🇲🇾',
    'thailand': '🇹🇭', 'bangkok': '🇹🇭',
    'vietnam': '🇻🇳', 'hanoi': '🇻🇳', 'ho chi minh': '🇻🇳',
    'america': '🇺🇸', 'usa': '🇺🇸', 'new york': '🇺🇸',
    'uk': '🇬🇧', 'london': '🇬🇧', 'england': '🇬🇧',
    'france': '🇫🇷', 'paris': '🇫🇷',
    'germany': '🇩🇪', 'berlin': '🇩🇪',
    'australia': '🇦🇺', 'sydney': '🇦🇺',
    'india': '🇮🇳', 'mumbai': '🇮🇳', 'delhi': '🇮🇳',
    'china': '🇨🇳', 'beijing': '🇨🇳', 'shanghai': '🇨🇳',
  };
  for (const [key, emoji] of Object.entries(flagMap)) {
    if (d.includes(key)) return emoji;
  }
  return '📍';
};

const getCurrencyInfo = (dest: string) => {
  const d = dest.toLowerCase();
  if (d.includes('japan') || d.includes('tokyo')) return { locale: 'ja-JP', currency: 'JPY' };
  if (d.includes('korea') || d.includes('seoul')) return { locale: 'ko-KR', currency: 'KRW' };
  if (d.includes('singapore')) return { locale: 'en-SG', currency: 'SGD' };
  if (d.includes('malaysia') || d.includes('kuala lumpur')) return { locale: 'ms-MY', currency: 'MYR' };
  if (d.includes('america') || d.includes('usa') || d.includes('new york')) return { locale: 'en-US', currency: 'USD' };
  if (d.includes('uk') || d.includes('england') || d.includes('london')) return { locale: 'en-GB', currency: 'GBP' };
  if (d.includes('france') || d.includes('germany') || d.includes('italy') || d.includes('spain')) return { locale: 'de-DE', currency: 'EUR' };
  if (d.includes('australia') || d.includes('sydney')) return { locale: 'en-AU', currency: 'AUD' };
  if (d.includes('thailand') || d.includes('bangkok')) return { locale: 'th-TH', currency: 'THB' };
  if (d.includes('india') || d.includes('mumbai') || d.includes('delhi')) return { locale: 'en-IN', currency: 'INR' };
  return { locale: 'id-ID', currency: 'IDR' };
};

export function TripCard({ trip }: { trip: TripProps }) {
  const { locale, currency } = getCurrencyInfo(trip.destination);

  const formattedBudget = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(trip.budget);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 flex flex-col justify-between h-full">
      <div>
        {/* Destination */}
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-start gap-2">
            <span className="text-xl leading-none flex-shrink-0">{getDestinationIcon(trip.destination)}</span>
            <span className="line-clamp-2">{trip.destination}</span>
          </h3>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {trip.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getCategoryBadgeStyle(trip.category)}`}>
              {trip.category}
            </span>
          )}
          {trip.travel_style && (
            <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
              {trip.travel_style}
            </span>
          )}
          {trip.season && (
            <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
              {trip.season}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-1.5 mb-5">
          <p className="text-slate-600 text-sm flex items-center gap-2">
            <span>⏱️</span> {trip.days} day{trip.days !== 1 ? 's' : ''}
          </p>
          <p className="text-slate-600 text-sm flex items-center gap-2">
            <span>💰</span> <span className="font-semibold">{formattedBudget}</span>
          </p>
        </div>
      </div>

      <Link
        href={`/trips/${trip.id}`}
        className="inline-block text-center w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        View Details
      </Link>
    </div>
  );
}
