🔌 EV Charging Station Chatbot

The EV Charging Station Chatbot is an AI-powered conversational application designed to help users easily find and understand information about electric vehicle (EV) charging stations. 
Using natural language input, users can ask queries such as nearby charging locations, station details, or availability, and the chatbot responds intelligently by processing charging station data. 
This project demonstrates the practical use of chatbots, APIs, and data handling to support sustainable mobility and smart transportation solutions.


🚀 Getting Started
💡 Prerequisites

Make sure you have:

Python 3.8+

An API key for any external services (e.g., Google Places if used)

OpenAI API credentials (if using GPT)

📦 Installation

Clone the repository

git clone https://github.com/nanthiesh007/ev-charging-station-chatbot-main.git
cd ev-charging-station-chatbot


Create and activate a virtual environment

python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate


Install dependencies

pip install -r requirements.txt

🧩 Environment Configuration

Copy .env.example to .env

cp .env.example .env


Add your API keys:

OPENAI_API_KEY=your_openai_key
DATA_API_KEY=your_data_api_key

💬 How It Works

The user enters a natural language query about charging stations.

The chatbot passes the input to the large language model.

Station data is fetched (via API or dataset).

The bot responds with relevant, structured information.

📌 Example Commands
python src/main.py "Find EV charging stations near Lyon"


Typical queries:

“Where is the nearest EV charging station?”

“List stations with CCS connectors within 10km.”

“Show me fast chargers near Marseille.”

🧠 API / Data Integration

The chatbot can be extended to fetch real-time charging station data from APIs such as:

Google Places API (type: electric_vehicle_charging_station)

Open Charge Map API

Local datasets (CSV/JSON imported)

Example structure for API helper:

def fetch_stations(location, radius_km):
    # Call external API and return station list

🧪 Testing

To run unit tests:

pytest


Add tests under /tests covering:

API data retrieval

Chatbot answer generation

Edge cases (no stations found)

📦 Deployment

Deploy as a web app:

Use Flask / FastAPI backend

Host on services like Render, Heroku, or Vercel

Ensure environment variables are configured

Example (Flask):

export FLASK_APP=src/main.py
flask run --host=0.0.0.0 --port=5000

🚧 Roadmap

Future improvements:

✅ Add interactive web UI
✅ Integrate maps (Google Maps / Leaflet)
✅ Add user authentication and preferences
✅ Add localized language support

👥 Contributing

Fork it

Create your feature branch

Commit your changes

Push and create a pull request

All contributions are welcome!
