# FitZone AI — Local ML Runbook

FitZone's core completion-personalization service is the FastAPI application under `ai-service`.

## Start all three local services

### CMD 1 — Frontend
```cmd
cd /d F:\FitZone-AI\frontend
npm run dev
```

### CMD 2 — Backend
```cmd
cd /d F:\FitZone-AI\backend
npm start
```

### CMD 3 — ML
```cmd
cd /d F:\FitZone-AI\ai-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Expected ML address:
`http://127.0.0.1:8000`

## Check model state

Open:
`http://127.0.0.1:8000/health`

A healthy service may still report a cold-start model. Look for:
- `model_trained: true` for a trained completion model.
- `training_samples` greater than zero.

The application intentionally distinguishes a trained model from its cold-start prediction path; it must not claim a trained model when no training state exists.
