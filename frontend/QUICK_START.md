# 🚀 Quick Start - Porter Logistics Integration

## Get Up and Running in 5 Minutes

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Porter API
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Porter API key
# Get key from: https://porter.in/business
VITE_PORTER_API_KEY=your_actual_key_here
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Access the Pages

#### **Option 1: Full Porter Integration** (Recommended for Production)
Navigate to: **http://localhost:5173/porter-logistics**

This page uses REAL Porter API:
- ✅ Real-time vehicle quotes
- ✅ Live booking
- ✅ Real tracking
- ✅ Driver details
- 💰 Requires Porter API key

**Features:**
- Step-by-step booking flow
- Multiple vehicle types
- Live pricing from Porter
- Real order tracking
- Driver contact details

#### **Option 2: Enhanced Logistics** (Demo with Mock Data)
Navigate to: **http://localhost:5173/logistics**

This page uses mock data (no API required):
- ✅ Works immediately
- ✅ Google Maps integration
- ✅ Vehicle selection UI
- ✅ Tracking simulation
- 🆓 No API key needed

**Features:**
- Route calculator
- Live tracking simulation
- Porter-style vehicle cards
- Contract approval flow

---

## 📋 Page Comparison

| Feature | /porter-logistics | /logistics |
|---------|------------------|------------|
| **Real API** | ✅ Porter API | ❌ Mock data |
| **Live Quotes** | ✅ Real-time | ❌ Static |
| **Vehicle Booking** | ✅ Creates real orders | ❌ Demo only |
| **Live Tracking** | ✅ GPS-based | ✅ Simulated |
| **Driver Details** | ✅ Real drivers | ✅ Mock data |
| **Cost** | 💰 Pay per ride | 🆓 Free |
| **Setup Time** | 30 mins | 0 mins |
| **Best For** | Production | Demo/Development |

---

## 🎯 Which Page to Use?

### Use `/porter-logistics` when:
- ✅ You have Porter API access
- ✅ Need real vehicle booking
- ✅ Production deployment
- ✅ Actual order tracking
- ✅ Real pricing quotes

### Use `/logistics` when:
- ✅ Quick demo/presentation
- ✅ Development/testing UI
- ✅ No API access yet
- ✅ Learning the flow
- ✅ Frontend development

---

## 🔑 Getting Porter API Key

### Free Trial / Sandbox
1. Visit: https://porter.in/business
2. Sign up for business account
3. Request API access
4. Get UAT (testing) API key
5. Use base URL: `https://pfe-apigw-uat.porter.in`

### Production
1. Complete KYC verification
2. Get production API key
3. Use base URL: `https://pfe-apigw-prod.porter.in`
4. Pay per completed ride

---

## 🧪 Testing Without API Key

You can still explore the UI:

1. Start dev server: `npm run dev`
2. Go to: http://localhost:5173/logistics
3. Try all features with simulated data
4. See the complete flow

When ready for real integration:
1. Get Porter API key
2. Add to `.env`
3. Go to: http://localhost:5173/porter-logistics
4. Book real vehicles!

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── PorterLogisticsPage.tsx      # Real Porter API integration
│   │   └── LogisticsPageEnhanced.tsx    # Demo with mock data
│   ├── components/
│   │   ├── VehicleTracker.tsx           # Live tracking UI
│   │   ├── VehicleSelection.tsx         # Porter-style cards
│   │   └── GoogleMapsView.tsx           # Map integration
│   └── lib/
│       ├── porterAPI.ts                 # Porter API service
│       └── api.ts                       # Backend API client
├── .env.example                         # Environment template
└── package.json                         # Dependencies (axios added)
```

---

## 🎨 UI Features

Both pages include:
- ✅ **Step Progress Indicator** - Visual flow tracking
- ✅ **Address Forms** - Pickup & delivery details
- ✅ **Vehicle Cards** - Porter-style design
- ✅ **Live Map** - Route visualization
- ✅ **Driver Details** - Rating, vehicle, contact
- ✅ **Real-time Updates** - Status tracking
- ✅ **Mobile Responsive** - Works on all devices

---

## 🐛 Common Issues

### "API key not valid"
```bash
# Check .env file
cat .env | grep VITE_PORTER_API_KEY

# Restart dev server
npm run dev
```

### "No vehicles available"
- Try different cities (Ahmedabad ↔ Vadodara works)
- Check pincode is 6 digits
- Verify cities are in Porter's service area

### "Module not found: axios"
```bash
npm install axios
```

---

## 📊 Next Steps

1. ✅ **Test the UI** - Explore both pages
2. ✅ **Get API Key** - Sign up with Porter
3. ✅ **Test Booking** - Try UAT environment first
4. ✅ **Go Live** - Switch to production when ready

---

## 📞 Need Help?

- **Porter Support**: api-support@porter.in
- **Docs**: See `PORTER_SETUP_GUIDE.md` for detailed instructions
- **API Docs**: Check `API_INTEGRATION_GUIDE.md`

---

**Status**: ✅ Ready to use!
**Demo**: http://localhost:5173/logistics
**Production**: http://localhost:5173/porter-logistics (requires API key)

🎉 Happy booking!
