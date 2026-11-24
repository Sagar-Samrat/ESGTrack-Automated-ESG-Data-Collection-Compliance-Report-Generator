# ESGTrack Production Deployment Guide

This guide covers deployment procedures for Vercel (Frontend), Render (Backend), Docker, and MongoDB Atlas.

---

## 1. MongoDB Atlas Configuration
1. Create a MongoDB Atlas cluster (M0 free tier or higher).
2. Under **Network Access**, add `0.0.0.0/0` (or the specific IP of your Render backend).
3. Under **Database Access**, create a user with `readWriteAnyDatabase` privileges.
4. Copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/esgtrack_prod?retryWrites=true&w=majority
   MONGODB_DB_NAME=esgtrack_prod
   ```

---

## 2. Backend Deployment on Render
1. Create a new **Web Service** on Render and connect your Git repository.
2. Configure settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `APP_ENV`: `production`
   - `DEBUG`: `False`
   - `JWT_SECRET_KEY`: `<Generate a random 32-byte secret>`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `MONGODB_DB_NAME`: `esgtrack_prod`
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
   - `CORS_ORIGINS`: `["https://your-frontend-domain.vercel.app"]`

---

## 3. Frontend Deployment on Vercel
1. In Vercel, import your project repository.
2. Select the **Root Directory** as `frontend`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Update `frontend/vercel.json` rewrites to proxy `/api/(.*)` requests to your Render backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://esgtrack-backend.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

---

## 4. Docker Deployment
You can also run ESGTrack using Docker:
```bash
docker build -t esgtrack-backend:latest .
docker run -p 8000:8000 \
  -e JWT_SECRET_KEY="production-secret" \
  -e MONGODB_URI="mongodb://localhost:27017" \
  esgtrack-backend:latest
```

