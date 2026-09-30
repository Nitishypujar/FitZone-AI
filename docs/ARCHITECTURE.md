# FitZone AI - Architecture

## Production Architecture

User
  to Vercel Frontend
  to Render Backend
  to Supabase PostgreSQL
  to Gemini API
  to Render FastAPI AI/ML Service

## Frontend

React 18 + Vite 5.

Responsible for the application interface, authentication flows, dashboard,
workouts, AI plans, progress, nutrition, goals, assistant and profile.

## Backend

Node.js + Express 5.

Responsible for API routing, authentication, authorization, Supabase
integration, Gemini integration, recommendations, workout APIs and
communication with the AI/ML service.

## AI/ML Service

Python + FastAPI.

Provides model-based fitness prediction and related ML endpoints.

## Database

Supabase PostgreSQL provides the hosted application database.

## Production Platforms

Frontend: Vercel
Backend: Render
AI/ML Service: Render
Database: Supabase
