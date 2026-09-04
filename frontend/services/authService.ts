const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function registerUser(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
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
  const res = await fetch(`${API_URL}/auth/login`, {
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
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

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
