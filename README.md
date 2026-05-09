# Arabic Reviews Sentiment Analysis

A production-ready web application for analyzing sentiment in Arabic product reviews using domain-adapted transformer models. The system provides both REST API endpoints and a modern web interface for sentiment classification with confidence scores and user feedback capabilities.

![Python](https://img.shields.io/badge/Python-3.12+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135+-green)
![React](https://img.shields.io/badge/React-Latest-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Features

-  **Arabic Sentiment Analysis:** Classifies reviews into positive, or negative using a fine-tuned Transformer model.
-  **FastAPI Backend:** High-performance REST API supporting both real-time single and batch predictions.
-  **React Dashboard:** Intuitive web interface for easy interaction and viewing confidence scores.
-  **Feedback System:** Collects user corrections via PostgreSQL to continuously improve the model.
-  **Docker Ready:** Fully containerized for quick and easy deployment.

  ## 🏗️ Architecture & Internal Networking

The application is built using a containerized microservices architecture orchestrated by Docker Compose. It consists of three decoupled services communicating over an internal bridge network.

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef external fill:#6b7280,stroke:#374151,stroke-width:2px,color:#fff,stroke-dasharray: 5 5

    %% Nodes
    User((User / Browser)):::external
    HostHost([Host Machine]):::external
    
    subgraph Docker Internal Network
        FrontEnd["🌐 Frontend (React/Vite)<br>arabic_sentiment_frontend"]:::frontend
        BackEnd["⚙️ Backend (FastAPI)<br>arabic_sentiment_backend"]:::backend
        DB[("🗄️ Database (PostgreSQL)<br>arabic_sentiment_db")]:::db
    end

    %% External Connections
    User -- "HTTP :5173" --> HostHost
    User -- "HTTP :8000" --> HostHost
    HostHost -- "Port Forward" --> FrontEnd
    HostHost -- "Port Forward" --> BackEnd
    HostHost -. "Optional :5432" .-> DB

    %% Internal Connections
    FrontEnd -- "REST API Calls<br>(via User Browser)" --> BackEnd
    BackEnd -- "Internal TCP :5432" --> DB
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended) or
- **Python 3.12+** and **Node.js 20+** (for local development)
- **PostgreSQL 15** (for local development)
- **GPU Support**: CUDA 12.1 (optional, for faster inference)

### Installation with Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Arabic-Reviews-Sentiment.git
cd Arabic-Reviews-Sentiment
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD
```

3. **Build and start containers**
```bash
docker-compose build
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Installation for Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Arabic-Reviews-Sentiment.git
cd Arabic-Reviews-Sentiment
```

2. **Create virtual environment**
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Initialize database**
```bash
python -c "from app.services.create_db import create_tables; create_tables()"
```

6. **Start the backend**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. **Start the frontend (in another terminal)**
```bash
cd frontend
npm install
npm run dev
```

## 📋 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Application
APP_NAME=Arabic Review Sentiment API
APP_VERSION=1.0.0

# Model Configuration
MODEL_PATH=model/cls_model              # Path to trained model
LABEL_MAP_PATH=model/label_map.json     # Label mapping file
DEVICE=-1                                # -1 for CPU, 0+ for GPU ID
MAX_LENGTH=128                           # Max token length

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=arabic_sentiment
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Logging
LOG_FILE=logs/app.log

# API
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
FRONTEND_BACKEND_URL=http://localhost:8000
```

## 🏗️ Project Structure

```
Arabic-Reviews-Sentiment/
├── app/                           # Backend FastAPI application
│   ├── main.py                   # Application entry point
│   ├── core/
│   │   ├── config.py             # Configuration management
│   │   └── logger.py             # Logging setup
│   ├── models/
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── inference.py          # Model loading and inference
│   │   └── preprocessing.py      # Text preprocessing for Arabic
│   ├── routes/
│   │   ├── predict.py            # Prediction endpoints
│   │   └── health.py             # Health check endpoints
│   └── services/
│       ├── predictor.py          # Single and batch prediction logic
│       ├── storage.py            # Database operations
│       └── create_db.py          # Database initialization
├── frontend/                      # React TypeScript frontend
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client services
│   │   └── App.tsx               # Main app component
│   ├── package.json
│   └── vite.config.ts
├── tests/                         # Pytest test suite
│   ├── test_api.py              # API endpoint tests
│   ├── test_inference.py        # Model inference tests
│   ├── test_storage.py          # Database operation tests
│   └── test_preprocessing.py    # Text preprocessing tests
├── model/                         # Trained model artifacts
│   ├── cls_model/               # Transformer model directory
│   └── label_map.json           # Sentiment labels mapping
├── logs/                          # Application logs
├── Dockerfile.backend             # Backend container configuration
├── Dockerfile.frontend            # Frontend container configuration
├── docker-compose.yaml            # Docker services orchestration
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🛠️ Development

### Backend Development

```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload

# Format code
black app/

# Type checking (if added)
mypy app/
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```


## 🔒 Security Considerations

- CORS is configured to allow all origins (adjust in production)
- Database credentials should be managed via environment variables
- API endpoints have error handling to prevent information leakage
- Input validation using Pydantic schemas
- SQL injection prevention via ORM

## 📈 Performance

- **Inference Latency**: ~100-200ms per review (CPU), ~20-50ms (GPU)
- **Batch Processing**: Process 100 reviews in ~1-2 seconds
- **Database**: PostgreSQL with connection pooling
- **API**: FastAPI ASGI server with Uvicorn

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
