import React, { useState, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { fetchNearby } from '../utils/api'
const COMMON_MODELS = [
'Tesla Model S',
'Tesla Model 3',
'Nissan Leaf',
'BYD',
'Any EV'
]
export default function ChatWindow() {
const [messages, setMessages] = useState([
{ id: 1, from: 'bot', text: 'Hello! I can find EV chargers near you. Which car model are you using?' }
]);
const [selectedModel, setSelectedModel] = useState(COMMON_MODELS[0]);
const [loading, setLoading] = useState(false);
const nextId = useRef(1000);
function pushMessage(from, text) {
setMessages(m => [...m, { id: nextId.current++, from, text }]);
}
async function handleUseMyLocation() {
pushMessage('user', `My car: ${selectedModel} — ask to find nearby
chargers`);
setLoading(true);
try {
if (!navigator.geolocation) throw new Error('Geolocation not supported');
navigator.geolocation.getCurrentPosition(async pos => {
const lat = pos.coords.latitude;
const lon = pos.coords.longitude;
pushMessage('bot', 'Searching nearby chargers...');
try {
const data = await fetchNearby({ lat, lon, carModel:
selectedModel });
// remove the 'Searching...' bot message
setMessages(m => m.filter(msg => msg.text !== 'Searching nearby chargers...'));
if (data.summary) pushMessage('bot', data.summary);
if (data.stations && data.stations.length) {
const listText = data.stations.slice(0,6).map(s => `${s.name} — $
{s.address || 'no address'}\nConnectors: $
{s.connectors.map(c=>c.type).join(', ') || 'N/A'}\nMaps: https://
www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`).join('\n\n');
pushMessage('bot', `Top stations:\n\n${listText}`);
} else {
pushMessage('bot', 'No stations found within the search radius.');
}
} catch (err) {
setMessages(m => m.filter(msg => msg.text !== 'Searching nearby chargers...'));
pushMessage('bot', `Error fetching stations: ${err.message}`);
}
setLoading(false);
}, err => {
setLoading(false);
pushMessage('bot', `Location error: ${err.message}`);
}, { timeout: 10000 });
} catch (err) {
setLoading(false);
pushMessage('bot', `Error: ${err.message}`);
}
}
return (
<div className="w-full max-w-2xl mx-auto mt-8 bg-white shadow-lg rounded9
lg p-4">
<div className="mb-4">
<label className="block text-sm text-gray-600 mb-1">Select your car
model</label>
<div className="flex gap-2 items-center">
<select value={selectedModel} onChange={e =>
setSelectedModel(e.target.value)} className="p-2 border rounded">
{COMMON_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
</select>
<button onClick={handleUseMyLocation} disabled={loading}
className="ml-auto px-3 py-2 bg-sky-600 text-white rounded">{loading ?
'Searching...' : 'Find chargers near me'}</button>
</div>
</div>
<div className="h-[60vh] overflow-auto p-3 border rounded mb-3 bggray-50" id="chat-window">
{messages.map(m => (
<MessageBubble key={m.id} from={m.from} text={m.text} />
))}
</div>
</div>
)
}