# Complete Setup Guide - Azure Custom Vision Integration

## 📁 File Structure

Your website should have this structure:

```
crop-disease-website/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js          ← UPDATE THIS FILE WITH YOUR CREDENTIALS
│   └── main.js
└── README.md (this file)
```

---

## 🚀 Quick Start (3 Options)

### Option 1: Test with Mock Data (No Setup Required)

1. **Open `index.html`** in your browser
2. **Upload an image** and click "Analyze"
3. **See demo results** (random predictions)

**No configuration needed!** Perfect for testing the interface.

---

### Option 2: Connect to Azure Custom Vision (Real AI)

Follow these steps to use your actual trained model:

#### Step 1: Get Azure Credentials

1. Go to https://www.customvision.ai
2. Sign in with your Microsoft account
3. Open your project: "Crop-Disease-Detector"
4. Click **"Performance"** tab
5. Click **"Publish"** button (if not already published)
   - Name: `Iteration1`
   - Resource: Select your prediction resource
   - Click "Publish"
6. Click **"Prediction URL"** button
7. You'll see a popup with two URLs

**Copy these TWO things:**

```
POST https://southcentralus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/abc-123-def/classify/iterations/Iteration1/image
     ↑ THIS ENTIRE URL IS YOUR ENDPOINT

Prediction-Key: 1a2b3c4d5e6f7g8h9i0jklmnopqrstuv
                ↑ THIS IS YOUR KEY (32 characters)
```

#### Step 2: Update Configuration File

1. **Open `js/config.js`** in any text editor
2. **Find lines 15-16:**

```javascript
predictionEndpoint: 'YOUR_PREDICTION_ENDPOINT_URL_HERE',
predictionKey: 'YOUR_PREDICTION_KEY_HERE',
```

3. **Replace with your values:**

```javascript
predictionEndpoint: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/abc-123-def/classify/iterations/Iteration1/image',
predictionKey: '1a2b3c4d5e6f7g8h9i0jklmnopqrstuv',
```

4. **Change line 22 from `true` to `false`:**

```javascript
useMockData: false,  // ← CHANGE THIS!
```

5. **Save the file**

#### Step 3: Test Your Connection

**Method A: Double-click HTML (Simple)**
1. Double-click `index.html`
2. Upload a leaf image
3. Click "Analyze Disease"
4. Should see real results!

**Method B: Use Local Server (Recommended - Avoids CORS)**

```bash
# Navigate to your website folder
cd path/to/crop-disease-website

# Start Python server
python -m http.server 8000

# Open browser: http://localhost:8000
```

**Method C: VS Code Live Server**
1. Open folder in VS Code
2. Install "Live Server" extension
3. Right-click `index.html` → "Open with Live Server"

---

### Option 3: Deploy Online (Best - No CORS Issues)

Deploy to avoid CORS errors when testing locally:

**Netlify (Easiest):**
1. Go to https://www.netlify.com
2. Drag and drop your entire folder
3. Wait 30 seconds
4. Get URL: `https://yoursite.netlify.app`

**GitHub Pages:**
1. Create GitHub repository
2. Upload all files
3. Settings → Pages → Select main branch
4. URL: `https://username.github.io/repo-name`

---

## 🔧 Configuration Options Explained

### config.js Settings

```javascript
const CONFIG = {
    // Your Azure endpoint (get from Custom Vision)
    predictionEndpoint: 'https://[region].api.cognitive.microsoft.com/...',
    
    // Your 32-character prediction key
    predictionKey: 'abc123def456...',
    
    // Use mock data or real API?
    useMockData: false,  // false = real Azure, true = demo data
    
    // Supported image formats
    supportedFormats: ['image/jpeg', 'image/png', 'image/bmp', 'image/gif'],
    
    // Max file size (6MB)
    maxFileSize: 6 * 1024 * 1024,
    
    // API timeout (30 seconds)
    apiTimeout: 30000,
    
    // Show console logs?
    debugMode: true  // Set to false in production
};
```

---

## 🐛 Troubleshooting

### Error: "Unauthorized - Check your Prediction-Key"

**Cause:** Wrong prediction key

**Fix:**
1. Go back to Custom Vision
2. Click "Prediction URL" again
3. Copy the EXACT key (32 characters)
4. Make sure no spaces before/after
5. Update `config.js`

**Check:**
```javascript
// ❌ WRONG (has spaces)
predictionKey: ' abc123 ',

// ✅ CORRECT
predictionKey: 'abc123',
```

---

### Error: "Endpoint not found"

**Cause:** Wrong endpoint URL or model not published

**Fix:**
1. Verify model is published in Custom Vision
2. Copy the ENTIRE URL from "Prediction URL" popup
3. Make sure it ends with `/image`
4. Update `config.js`

**Check:**
```javascript
// URL should end with /image
.../iterations/Iteration1/image
                          ^^^^
```

---

### Error: "CORS policy" or "Access-Control-Allow-Origin"

**Cause:** Browser security blocking local files

**Fix (Choose one):**

**Option A: Use Local Server**
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

**Option B: Deploy Online**
- Use Netlify, GitHub Pages, or Vercel
- CORS issues disappear on real servers

**Option C: Chrome with CORS disabled (Not recommended)**
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:/temp"

# Mac
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp"
```

---

### Error: "Network error"

**Cause:** No internet or firewall

**Fix:**
1. Check internet connection
2. Try opening https://google.com
3. Disable firewall temporarily
4. Check if Azure is blocked by IT

---

### Error: Results show "Unknown" treatment

**Cause:** Tag names don't match

**Your Custom Vision tags:**
```
"Powdery_Mildew", "Rust_Disease", "Healthy_Plant"
```

**What code expects:**
```
"powdery", "rust", "healthy"
```

**Fix:**

**Option 1: Rename in Custom Vision (Best)**
1. Go to Custom Vision
2. Rename tags to lowercase: `powdery`, `rust`, `healthy`
3. Retrain model

**Option 2: Update config in JavaScript**

Edit `main.js`, find `TREATMENTS` object (line ~20) and add your tags:

```javascript
const TREATMENTS = {
    'powdery_mildew': {  // Match your Custom Vision tag
        name: 'Powdery Mildew',
        // ... rest
    },
    'rust_disease': {  // Match your Custom Vision tag
        name: 'Rust Disease',
        // ... rest
    }
};
```

---

## 🎯 Testing Checklist

```
Setup Phase:
[ ] Files downloaded and organized
[ ] Azure model trained and published
[ ] Prediction endpoint copied
[ ] Prediction key copied (32 characters)
[ ] config.js updated with credentials
[ ] useMockData set to false

Testing Phase:
[ ] Open website (localhost or deployed)
[ ] Check browser console (F12) - no errors
[ ] Upload healthy leaf image
[ ] Click "Analyze Disease"
[ ] Wait 2-3 seconds
[ ] See real results (not mock 94%)
[ ] Confidence score changes with each image
[ ] Treatment recommendations display

Verify Real API:
[ ] Console shows "Using REAL Azure API"
[ ] Loading text says "Connecting to Azure..."
[ ] Results vary (not always same percentage)
[ ] Different images give different results
```

---

## 📊 Understanding Results

### What You'll See:

```
Disease Name: Powdery Mildew
Confidence: 94.3%        ← Should vary each time
Severity: Moderate

All Predictions:
• powdery: 94.3%        ← Top prediction
• rust: 4.2%            ← Second
• healthy: 1.5%         ← Third

Treatment Recommendations:
[Shows organic, chemical, and prevention tips]
```

### Confidence Levels:

- **90-100%**: High confidence - Likely correct
- **70-89%**: Medium confidence - Probably correct
- **50-69%**: Low confidence - Uncertain
- **<50%**: Very low - Check image quality

---

## 🔐 Security Notes

**Important:** Your API key is visible in JavaScript!

For **learning/demo**: This is fine
For **production**: Use a backend server to hide keys

**Production setup:**
```
User → Your Server → Azure API
     (hides key)
```

**Never:**
- Commit `config.js` with real keys to public GitHub
- Share your prediction key publicly
- Use production keys in demos

---

## 📱 Browser Compatibility

✅ Chrome (recommended)
✅ Edge
✅ Firefox
✅ Safari
✅ Mobile browsers

**Note:** Internet Explorer not supported

---

## 💡 Tips

1. **Test with mock data first** to verify interface works
2. **Check console (F12)** for detailed error messages
3. **Use local server** to avoid CORS issues
4. **Deploy online** for best experience
5. **Keep debugMode: true** while developing

---

## 📞 Still Having Issues?

1. **Check console (F12 → Console tab)** for error messages
2. **Verify** model is published in Custom Vision
3. **Copy credentials again** from Custom Vision
4. **Test** with different images
5. **Try** deploying online (Netlify)

---

## 🎓 What's Happening Behind the Scenes

When you click "Analyze Disease":

```
1. Image selected → File validated (size, format)
2. Click Analyze → Show loading screen
3. config.js → Check if useMockData is false
4. If real API:
   a. Read image file as binary
   b. Send POST request to Azure endpoint
   c. Include Prediction-Key in headers
   d. Azure processes with your trained model
   e. Returns JSON with predictions
5. Parse response → Get top prediction
6. Match disease tag → Get treatment info
7. Display results with animations
```

**Mock mode:** Skips steps 4a-4e, returns random data

---

## ✅ Success Indicators

You know it's working when:

✅ Console shows: "Using REAL Azure API"
✅ Loading text: "Connecting to Azure Custom Vision..."
✅ Results appear in ~2 seconds
✅ Confidence varies (not always 94%)
✅ Different images → different predictions
✅ No errors in console (F12)

---

**Good luck! Your AI-powered crop disease detector is ready to use! 🌱🚀**
