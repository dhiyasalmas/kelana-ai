// All trip-related API calls live here
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function getTrips() {
  // Tambahkan { cache: "no-store" } di sini
  const res = await fetch(`${API_URL}/trips`, { cache: "no-store" })
  return res.json()
}

export async function getTrip(id: number) {
  // Tambahkan { cache: "no-store" } di sini
  const res = await fetch(`${API_URL}/trips/${id}`, { cache: "no-store" })
  return res.json()
}

export async function generateTrip(data: any) {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })
  return res.json()
}