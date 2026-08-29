const API_URL = "http://127.0.0.1:8000/api/v1/auth";

export async function registerUser(data: any) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Gagal melakukan registrasi");
  }
  return res.json();
}

export async function loginUser(data: any) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Email atau password salah");
  }
  return res.json();
}

export async function getUserProfile() {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  // Auto-logout jika token tidak valid
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Sesi telah habis");
  }

  if (!res.ok) {
    throw new Error("Gagal mengambil data profil");
  }
  
  return res.json();
}