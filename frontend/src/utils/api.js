import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
export async function fetchNearby({ lat, lon, carModel, distanceKm = 5 }) {
const res = await axios.post(`${API_BASE}/api/nearby`, { lat, lon,
carModel, distanceKm });
return res.data;
}
