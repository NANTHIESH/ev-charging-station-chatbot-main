import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Create session on load
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------------------------------------------
  // 🔥 Utility: Get current browser location
  // -------------------------------------------------------------
  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => reject("Location permission denied")
      );
    });
  }

  // -------------------------------------------------------------
  // 🔥 Detect if user is asking for nearby stations
  // -------------------------------------------------------------
  function isNearbyQuery(text) {
    const t = text.toLowerCase();
    return (
      t.includes("near") ||
      t.includes("nearby") ||
      t.includes("closest") ||
      t.includes("fast charger") ||
      t.includes("stations") ||
      t.includes("supercharger") ||
      t.includes("charging station") ||
      t.includes("find chargers")
    );
  }

  // -------------------------------------------------------------
  // MAIN send message function
  // -------------------------------------------------------------
  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    const text = input;
    setInput("");
    setLoading(true);

    try {
      // ---------------------------------------------------------
      // 🔥 Case 1: User is asking for location-based stations
      // ---------------------------------------------------------
      if (isNearbyQuery(text)) {
        try {
          const { lat, lon } = await getCurrentLocation();

          const res = await axios.post("http://localhost:3001/api/nearby", {
            lat,
            lon,
            carModel: "Tesla Model 3",
            distanceKm: 5
          });

          // Show Gemini summary
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.data.summary }
          ]);

          // Show raw station list
          const pretty = res.data.stations
            ?.map(
              (s, i) =>
                `${i + 1}. **${s.name}**  
📍 ${s.address || "No address"}  
🔌 Connectors: ${
                  s.connectors?.map((c) => c.type).join(", ") || "Unknown"
                }  
🌍 https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`
            )
            .join("\n\n");

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "**Nearby Stations Found:**\n" + (pretty || "No stations found.")
            }
          ]);
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "❌ Could not access your location. Please allow location access."
            }
          ]);
        }

        setLoading(false);
        return;
      }

      // ---------------------------------------------------------
      // 🔥 Case 2: Normal chatbot conversation
      // ---------------------------------------------------------
      const res = await axios.post("http://localhost:3001/api/chat", {
        sessionId,
        history: [...messages, userMessage]
      });

      const botMessage = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + err.message }
      ]);
    }

    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") sendMessage();
  }

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col w-full max-w-2xl mx-auto bg-white shadow-lg">

        {/* Header */}
        <div className="p-4 bg-green-600 text-white font-bold text-lg">
          ⚡ EV Charging Chatbot
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-green-500 text-white ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="p-3 bg-gray-300 rounded-xl max-w-[50%] animate-pulse">
              Typing…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded-lg p-3 focus:outline-green-600"
            placeholder="Ask anything… e.g. 'Find chargers nearby'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-5 rounded-lg"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}
