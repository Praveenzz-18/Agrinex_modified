# Agrinex Project - Setup Guide

This guide will help you run the Agrinex project on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - for the frontend
- **Python 3.9** - for the backend (Python 3.14 has compatibility issues)
- **npm** - comes with Node.js

## Project Structure

```
Agrinex-main/
├── frontend/          # React + Vite application
└── backend/           # FastAPI application
```

## Step-by-Step Setup

### Part 1: Backend Setup

#### Step 1: Open Terminal/PowerShell
Navigate to the backend directory:
```powershell
cd d:\Projects\Agrinex-main\Agrinex-main\backend
```

#### Step 2: Install Python Dependencies
Make sure you're using Python 3.9 (not 3.14):
```powershell
# Check Python version
py -3.9 --version

# Install dependencies using Python 3.9
py -3.9 -m pip install -r requirements.txt
```

> **Note**: If the installation fails, you may need to install packages individually:
> ```powershell
> py -3.9 -m pip install fastapi uvicorn pydantic python-dotenv appwrite pydantic-settings httpx pandas numpy scikit-learn joblib requests streamlit
> ```

#### Step 3: (Optional) Create Environment File
Create a `.env` file in the backend directory if you have Appwrite credentials:
```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
```

> **Note**: The backend will run without this file, but database features won't work.

#### Step 4: Start the Backend Server
```powershell
# Make sure you're in the backend directory
cd d:\Projects\Agrinex-main\Agrinex-main\backend

# Start the server
py -3.9 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

✅ **Backend is now running at**: http://localhost:8000
✅ **API Documentation**: http://localhost:8000/docs

---

### Part 2: Frontend Setup

#### Step 1: Open a New Terminal/PowerShell Window
Keep the backend terminal running and open a new one.

Navigate to the frontend directory:
```powershell
cd d:\Projects\Agrinex-main\Agrinex-main\frontend
```

#### Step 2: Install Node Dependencies
```powershell
npm install
```

This will install all required packages (React, Vite, etc.). It may take a few minutes.

> **Troubleshooting**: If you encounter errors, try:
> ```powershell
> # Delete node_modules and reinstall
> rm -Force -Recurse node_modules
> npm install
> ```

#### Step 3: Start the Frontend Development Server
```powershell
npm run dev
```

You should see:
```
VITE v7.3.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend is now running at**: http://localhost:5173

---

## Accessing the Application

1. **Open your browser** and navigate to: http://localhost:5173
2. You should see the Agrinex homepage with features like:
   - Micro Weather Forecasting
   - AI Crop Recommendations
   - Zone-Based Soil Analytics
   - Irrigation AI
   - Multi-Farm Network Map
   - Credit & ROI Proof

3. **Test the Backend API** by visiting: http://localhost:8000/docs
   - This shows all available API endpoints
   - You can test endpoints directly from this interface

---

## Quick Reference Commands

### To Start Both Servers

**Terminal 1 (Backend):**
```powershell
cd d:\Projects\Agrinex-main\Agrinex-main\backend
py -3.9 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd d:\Projects\Agrinex-main\Agrinex-main\frontend
npm run dev
```

### To Stop Servers
Press `Ctrl + C` in each terminal window.

---

## Common Issues & Solutions

### Issue 1: "Python 3.9 not found"
**Solution**: Install Python 3.9 from [python.org](https://www.python.org/downloads/) or use the Python launcher:
```powershell
py --list-paths  # Check available Python versions
```

### Issue 2: "Module not found" errors in backend
**Solution**: Reinstall dependencies:
```powershell
py -3.9 -m pip install -r requirements.txt --force-reinstall
```

### Issue 3: Frontend shows blank page or errors
**Solution**: Clear cache and reinstall:
```powershell
rm -Force -Recurse node_modules
npm install
npm run dev
```

### Issue 4: Port already in use
**Solution**: Either:
- Stop the process using that port
- Or use a different port:
  ```powershell
  # Frontend on different port
  npm run dev -- --port 3000
  
  # Backend on different port
  py -3.9 -m uvicorn app.main:app --reload --port 8001
  ```

### Issue 5: Database features not working
**Solution**: This is expected if you don't have Appwrite credentials. The UI will work, but features requiring database access won't function.

---

## Project URLs Summary

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main application UI |
| Backend API | http://localhost:8000 | REST API server |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Health Check | http://localhost:8000/health | Backend health status |

---

## Next Steps

1. ✅ Both servers running
2. 🌐 Open http://localhost:5173 in your browser
3. 🔍 Explore the features
4. 📚 Check API docs at http://localhost:8000/docs
5. 🔧 Configure Appwrite credentials if you need database features

---

## Need Help?

- Check the terminal output for error messages
- Ensure both servers are running simultaneously
- Verify you're using Python 3.9 (not 3.14)
- Make sure ports 5173 and 8000 are not in use by other applications
