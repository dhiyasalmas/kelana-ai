// All trip-related API calls live here
const API_URL = process.env.NEXT_PUBLIC_API_URL

const getAuthHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export async function getTrips() {
  const res = await fetch(`${API_URL}/api/v1/trips`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });
  
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return [];
  }

  if (!res.ok) {
    console.error("Gagal mengambil data trips dari backend");
    return []; 
  }
  
  return res.json();
}

export async function getTrip(id: number) {
  // UBAH DISINI: Tambahkan /api/v1 di depan /trips/${id}
  const res = await fetch(`${API_URL}/api/v1/trips/${id}`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });
  
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return { detail: "Unauthorized" };
  }
  
  if (!res.ok) {
    return { detail: "Trip not found" };
  }
  
  return res.json();
}