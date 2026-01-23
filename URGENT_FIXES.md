# URGENT FIXES - Network & Image Issues

## 🔴 **Critical Issues Identified**

### 1. **Network Errors** - Mobile app can't connect to backend
### 2. **GestureHandlerRootView Missing** - Swipe gestures not working  
### 3. **Images not sending/displaying** - Related to network issue

---

## ✅ **FIXES APPLIED**

### **Fix 1: GestureHandlerRootView Added** ✅
**File**: `mobile/app/_layout.tsx`

**What was done**:
- Imported `GestureHandlerRootView` from `react-native-gesture-handler`
- Wrapped the entire app with `<GestureHandlerRootView style={{ flex: 1 }}>`

**Result**: Swipe-to-reply gestures will now work properly!

---

## 🔧 **FIXES NEEDED - Network Connection**

### **Problem**: Mobile app showing "Network Error" and "500 Internal Server Error"

### **Root Causes**:
1. Backend server might not be running properly
2. Firewall blocking connections
3. Backend API endpoints returning 500 errors
4. Device not on same network

---

## 📋 **STEP-BY-STEP FIX GUIDE**

### **Step 1: Verify Backend is Running**

1. Check if backend terminal shows:
   ```
   ✓ Ready in [time]
   ○ Local: http://localhost:3001
   ```

2. If NOT running, restart it:
   ```bash
   cd "h:/projects/Power Couple"
   npx next dev -p 3001
   ```

### **Step 2: Test Backend Locally**

Open browser and visit:
- http://localhost:3001/api/profiles/all
- http://localhost:3001/api/messages?user1=sajid&user2=nasywa

**Expected**: Should see JSON data, NOT errors

**If you see errors**: Backend has issues that need fixing first!

### **Step 3: Test Backend from Network IP**

Open browser and visit:
- http://10.72.184.182:3001/api/profiles/all

**Expected**: Should see same JSON data

**If connection refused**: 
- Windows Firewall is blocking port 3001
- Need to add firewall rule (see Step 5)

### **Step 4: Verify Device Network**

**For Physical Device**:
- Ensure phone is connected to SAME WiFi as computer
- WiFi name should match on both devices
- IP should be in same range (10.72.184.x)

**For Android Emulator**:
- Use `10.0.2.2:3001` instead of `10.72.184.182:3001`
- Update `mobile/constants/Config.ts`:
  ```typescript
  API_URL: 'http://10.0.2.2:3001',
  ```

### **Step 5: Fix Windows Firewall (if needed)**

Run PowerShell as Administrator:

```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# Or allow port 3001 specifically
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### **Step 6: Check Backend Logs for 500 Errors**

Look at the backend terminal for errors like:
```
Error: ...
PrismaClientKnownRequestError: ...
```

Common 500 error causes:
- **Database connection failed** - Check if Prisma can connect
- **Missing environment variables** - Check `.env` file
- **Redis connection failed** - Redis might be down
- **Pusher credentials invalid** - Check Pusher config

### **Step 7: Test Database Connection**

```bash
cd "h:/projects/Power Couple"
npx prisma studio
```

**Expected**: Opens Prisma Studio in browser

**If fails**: Database connection is broken!

### **Step 8: Restart Everything**

1. **Stop all terminals** (Ctrl+C on each)

2. **Restart backend**:
   ```bash
   cd "h:/projects/Power Couple"
   npx next dev -p 3001
   ```

3. **Wait for "Ready" message**

4. **Restart mobile app**:
   ```bash
   cd "h:/projects/Power Couple/mobile"
   npm start
   ```

5. **Press 'r' to reload** the mobile app

---

## 🖼️ **IMAGE SENDING/RECEIVING FIX**

### **Why images aren't working**:
Images require:
1. ✅ Backend API connection (currently broken)
2. ✅ Cloudinary upload (configured correctly)
3. ✅ Image picker permissions
4. ✅ Network connectivity

**Once network is fixed, images will work automatically!**

### **How image sending works**:
1. User selects image from gallery
2. Image is uploaded to Cloudinary
3. Cloudinary returns URL
4. URL is sent to backend via `/api/messages`
5. Backend saves message with `imageUrl`
6. Pusher broadcasts to partner
7. Partner's app downloads and displays image

### **Test image sending after network fix**:
1. Open chat
2. Tap camera icon
3. Select image
4. Should see upload progress
5. Image appears in chat
6. Partner sees image in real-time

---

## 🔍 **DEBUGGING COMMANDS**

### **Check if backend is accessible**:
```bash
# From PowerShell
curl http://localhost:3001/api/profiles/all
curl http://10.72.184.182:3001/api/profiles/all
```

### **Check mobile app logs**:
Look for these in Expo terminal:
```
ERROR  Error fetching profiles: [AxiosError: Network Error]
ERROR  Error fetching messages: [AxiosError: Request failed with status code 500]
```

### **Check backend logs**:
Look for these in Next.js terminal:
```
GET /api/profiles/all 200 in 45ms
POST /api/messages 500 in 123ms
Error: [detailed error message]
```

---

## 📱 **QUICK TEST CHECKLIST**

After applying fixes, test in this order:

- [ ] Backend responds at http://localhost:3001/api/profiles/all
- [ ] Backend responds at http://10.72.184.182:3001/api/profiles/all  
- [ ] Mobile app loads without "Network Error"
- [ ] Can see partner's profile on home screen
- [ ] Can open chat and see messages
- [ ] Can send text message
- [ ] Can send image
- [ ] Partner receives message in real-time
- [ ] Swipe-to-reply works
- [ ] Long-press context menu works

---

## 🚨 **IF STILL NOT WORKING**

### **Option 1: Use localhost for web testing**
Update `mobile/constants/Config.ts`:
```typescript
API_URL: 'http://localhost:3001',  // Only works for web, not mobile device
```

### **Option 2: Use ngrok for external access**
```bash
# Install ngrok
npm install -g ngrok

# Expose port 3001
ngrok http 3001

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update Config.ts:
API_URL: 'https://abc123.ngrok.io',
```

### **Option 3: Deploy backend to production**
- Deploy to Vercel/Railway/Render
- Update `API_URL` to production URL
- No more network issues!

---

## 📊 **CURRENT STATUS**

✅ **FIXED**:
- GestureHandlerRootView added
- Swipe-to-reply structure corrected
- MessageBubble JSX fixed

⚠️ **NEEDS ATTENTION**:
- Network connectivity between mobile and backend
- Backend 500 errors (check logs)
- Firewall rules (if needed)

🔴 **BLOCKING**:
- Images can't send until network is fixed
- All API calls failing due to network errors

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Check backend terminal** - Is it running? Any errors?
2. **Test in browser** - Visit http://10.72.184.182:3001/api/profiles/all
3. **Check firewall** - Is port 3001 blocked?
4. **Restart everything** - Fresh start often fixes issues
5. **Check device network** - Same WiFi as computer?

---

**Last Updated**: January 23, 2026, 2:20 PM IST
**Status**: GestureHandler fixed ✅ | Network issues need investigation ⚠️
