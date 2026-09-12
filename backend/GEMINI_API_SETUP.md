# Gemini AI Setup Instructions

## Issue
Your current Gemini API key is invalid. The format doesn't match Google's Gemini API key structure.

## Steps to Fix

1. **Get a Valid Gemini API Key:**
   - Visit: https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key (should start with `AIza` and be ~39 characters)

2. **Update Your .env File:**
   - Open `backend/.env`
   - Replace the current `GEMINI_API_KEY` value with your new key
   - Example format: `GEMINI_API_KEY=AIzaSyAbc123def456ghi789jkl012mno345pqr678`

3. **Restart Your Backend Server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart it
   cd backend
   uvicorn app.main:app --reload
   ```

## What Was Fixed in the Code

✅ Updated all Gemini model references from `gemini-3.5-flash` (doesn't exist) to `gemini-2.0-flash-exp`
✅ All 5 API endpoints now use the correct model name:
   - Copilot chat
   - Personalized recommendations
   - Simulator insights
   - Logistics insights
   - Match explanations

## Test After Setup

Run this test to verify:
```bash
cd backend
python -c "from app.ai.layer2_gemini import gemini_layer2; import asyncio; result = asyncio.run(gemini_layer2.generate_copilot_response('Hello')); print(result)"
```

If successful, you should see a proper AI response instead of an error message.
