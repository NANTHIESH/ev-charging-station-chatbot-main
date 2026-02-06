import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ENV
const OCM_KEY = process.env.OPENCHARGEMAP_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

// ---------------------------------------------------------------------------
// GEMINI CHAT COMPLETION (OPENAI-COMPATIBLE)
// ---------------------------------------------------------------------------
async function callGemini(messages) {
  const safeMessages = messages.map(m => ({
    role: m.role,
    content: m.text || m.content || " "   // Prevent empty content error
  }));

  const resp = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_KEY}`,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: safeMessages,
        temperature: 0.7,
      }),
    }
  );

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Gemini error:", data);
    throw new Error(`Gemini API error ${resp.status}: ${data.error?.message}`);
  }

  return data.choices?.[0]?.message?.content || "No response.";
}

// ---------------------------------------------------------------------------
// OPENCHARGEMAP FETCH
// ---------------------------------------------------------------------------
async function fetchOCM(lat, lon, distanceKm = 5, maxResults = 12) {
  const url = new URL("https://api.openchargemap.io/v3/poi/");
  url.searchParams.append("output", "json");
  url.searchParams.append("latitude", lat);
  url.searchParams.append("longitude", lon);
  url.searchParams.append("distance", distanceKm);
  url.searchParams.append("distanceunit", "KM");
  url.searchParams.append("maxresults", maxResults);
  if (OCM_KEY) url.searchParams.append("key", OCM_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenChargeMap error: ${res.status}`);
  return res.json();
}

// Format stations for chatbot text
function formatStations(stations) {
  return stations
    .map(
      (s, i) => `
${i + 1}. **${s.name}**
📍 ${s.address}
🔌 Connectors: ${s.connectors.map(c => c.type).join(", ")}
🌍 https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// /api/chat — MAIN CHATBOT
// ---------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history))
      return res.status(400).json({ error: "history must be an array" });

    const messages = [
      {
        role: "system",
        content: "You are EV ChargeBot, an expert EV charging assistant."
      },
      ...history,
    ];

    const reply = await callGemini(messages);

    res.json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /api/nearby — FIND NEARBY CHARGERS
// ---------------------------------------------------------------------------
app.post("/api/nearby", async (req, res) => {
  try {
    const { lat, lon, carModel = "any", distanceKm = 5 } = req.body;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).json({ error: "lat & lon must be numbers" });
    }

    const raw = await fetchOCM(lat, lon, distanceKm, 12);

    const stations = raw.map(s => {
      const info = s.AddressInfo || {};
      return {
        id: s.ID,
        name: info.Title || "Unnamed station",
        address:
          `${info.AddressLine1 || ""} ${info.Town || ""} ${
            info.Postcode || ""
          }`.trim(),
        lat: info.Latitude,
        lon: info.Longitude,
        connectors: (s.Connections || []).map(c => ({
          type: c.ConnectionType?.Title || c.ConnectionTypeID,
          level: c.Level?.Title || null,
          powerKW: c.PowerKW || null,
        })),
        usage: s.UsageType?.Title,
        accessComments: s.AccessComments,
      };
    });

    // Sort based on car model
    const prefCCS = st =>
      st.connectors.some(c => /ccs/i.test(c.type)) ? 0 : 1;
    const prefCHA = st =>
      st.connectors.some(c => /chademo/i.test(c.type)) ? 0 : 1;

    let sorted = [...stations];
    const model = carModel.toLowerCase();

    if (model.includes("tesla")) sorted.sort((a, b) => prefCCS(a) - prefCCS(b));
    if (model.includes("leaf")) sorted.sort((a, b) => prefCHA(a) - prefCHA(b));

    // Ask Gemini to summarize (1 response only)
    const summary = await callGemini([
      {
        role: "user",
        content: `Summarize these EV stations for a ${carModel}. Be concise.`
      },
      { role: "user", content: JSON.stringify(sorted.slice(0, 8), null, 2) }
    ]);

    // Return unified response
    res.json({
      summary,
      stations: sorted,
      formatted: formatStations(sorted)
    });

  } catch (err) {
    console.error("NEARBY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
