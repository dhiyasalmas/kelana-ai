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
  const res = await fetch(`${API_URL}/trips`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });
  
  // FITUR BARU: Auto-Logout jika Token tidak valid / kedaluwarsa (Status 401)
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login"; // Tendang ke halaman login
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
  const res = await fetch(`${API_URL}/trips/${id}`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });
  
  // FITUR BARU: Auto-Logout jika Token tidak valid / kedaluwarsa (Status 401)
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