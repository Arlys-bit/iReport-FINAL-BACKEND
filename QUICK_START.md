# Quick Reference Guide

## 🚀 **Get Running in 5 Minutes**

### **Terminal 1: Start Backend**
```bash
cd backend
npm install
npm run dev
```
✅ Backend running at `http://localhost:3000`

### **Terminal 2: Start Frontend**
```bash
cd iReport
npm install
npm start
```

### **Then Choose One:**
```bash
# Web Browser
Press 'w'

# iOS Simulator (macOS)
Press 'i'

# Android Emulator
Press 'a'

# Physical Device
Scan QR code with Expo Go app
```

---

## 📋 **Frequently Used Commands**

### **Backend**
```bash
npm run dev          # Start dev server with auto-reload
npm run build        # Compile TypeScript
npm start            # Run compiled code
npm test             # Run tests
npm run lint         # Run linter
```

### **Frontend**
```bash
npm start            # Start dev server
npm run web          # Run web version
npm run ios          # Run iOS simulator
npm run android      # Run Android emulator
npm test             # Run tests
npm run type-check   # Check TypeScript
```

---

## 🔧 **Environment Files Setup**

### **Backend: `/backend/.env`**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ireport
JWT_SECRET=change_this_to_random_string_32_chars
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:8081,http://localhost:19000
GROQ_API_KEY=your_groq_key
```

### **Frontend: `/iReport/.env`**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
```

---

## 🗄️ **Database Setup**

### **MongoDB Local**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows (PowerShell)
# Download from mongodb.com and run installer

# Linux
sudo apt install mongodb

# Start MongoDB
mongod

# Access shell
mongosh
```

### **MongoDB Atlas (Free Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## 📱 **Build for App Stores**

### **Android APK/AAB**
```bash
cd iReport
npm install -g eas-cli
eas login
eas build --platform android --type apk      # APK
eas build --platform android --type app-bundle # AAB (Play Store)
```

### **iOS IPA**
```bash
cd iReport
npm install -g eas-cli
eas login
eas build --platform ios
```

### **Web**
```bash
cd iReport
npm run web
# Then deploy the build folder to Vercel/Netlify
```

---

## 🔐 **Default Test Accounts**

### **Admin**
- Email: `admin@school.edu`
- Password: `admin123`
- Role: Admin

### **Teacher**
- Email: `teacher@school.edu`
- Password: `teacher123`
- Role: Teacher

### **Student**
- Email: `student@school.edu`
- Password: `student123`
- Role: Student

---

## 📊 **API Health Check**

```bash
# Check if backend is running
curl http://localhost:3000/health

# Response
{"status":"ok","message":"iReport Backend API is running"}
```

---

## 🐛 **Common Issues & Fixes**

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `npx kill-port 3000` |
| Metro bundler cache | `npm start -- --clear` |
| MongoDB not running | `mongod` or `brew services start mongodb-community` |
| Dependency errors | `npm install` or `npm install --legacy-peer-deps` |
| CORS errors | Update `CORS_ORIGIN` in backend `.env` |
| Module not found | `npm install` in that directory |
| API 404s | Verify backend is running on port 3000 |

---

## 📚 **Documentation Links**

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Complete setup & deployment |
| [BUILD_GUIDE.md](./BUILD_GUIDE.md) | Building for iOS/Android |
| [backend/README.md](./backend/README.md) | Backend API overview |
| [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) | API endpoints |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Project completion status |

---

## 🚢 **Production Deployment Steps**

### **1. Prepare Code**
```bash
# Update version
# git tag v1.0.0
# git push origin v1.0.0
```

### **2. Deploy Backend**
```bash
# Heroku
cd backend
heroku login
heroku create ireport-api
git push heroku main

# Or AWS/GCP/etc
# Follow provider-specific instructions
```

### **3. Update Frontend Config**
```env
# In /iReport/.env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

### **4. Build & Submit App**
```bash
cd iReport
eas build --platform android
eas build --platform ios
# Upload to Google Play & App Store
```

---

## 📈 **Architecture Overview**

```
┌─────────────────────────────────────────────────────┐
│           React Native App (Expo)                   │
│   - Login / Dashboard / Reports / Live Incidents    │
│   - StateManagement: React Context + React Query    │
│   - Offline: AsyncStorage Cache                     │
└──────────────┬──────────────────────────────────────┘
               │
               ├─ API Calls (API Client)
               │
               ▼
┌─────────────────────────────────────────────────────┐
│         Express.js API Server                       │
│   - Authentication (JWT)                            │
│   - CRUD Operations                                 │
│   - Role-Based Access Control                       │
│   - Logging & Error Handling                        │
└──────────────┬──────────────────────────────────────┘
               │
               ├─ Database Queries (Mongoose)
               │
               ▼
┌─────────────────────────────────────────────────────┐
│         MongoDB Database                            │
│   - Users / Reports / Live Incidents                │
│   - Students / Buildings / Grades                   │
│   - Activity Logs / Violations                      │
└─────────────────────────────────────────────────────┘
```

---

## ✅ **Pre-Launch Checklist**

### **Code**
- [ ] All TypeScript errors resolved
- [ ] No console warnings/errors
- [ ] API working correctly
- [ ] Tests passing
- [ ] Code review completed

### **Configuration**
- [ ] `.env` files configured
- [ ] Database connected
- [ ] API URL correct
- [ ] CORS settings correct
- [ ] JWT secret strong

### **UI/UX**
- [ ] All screens tested
- [ ] No broken links
- [ ] Responsive on all devices
- [ ] Dark mode working
- [ ] Offline mode tested

### **Performance**
- [ ] Bundle size checked
- [ ] App loads in <3 seconds
- [ ] No memory leaks
- [ ] API response time <1s

### **Security**
- [ ] No credentials in code
- [ ] HTTPS enabled
- [ ] Input validation working
- [ ] Error messages safe
- [ ] Dependencies updated

### **Deployment**
- [ ] Build successful
- [ ] Signed certificates ready
- [ ] Screenshots prepared
- [ ] Privacy policy written
- [ ] Terms of service available

---

## 📞 **Getting Help**

### **Documentation**
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
- See [BUILD_GUIDE.md](./BUILD_GUIDE.md)

### **Tech Support**
- Expo: https://docs.expo.dev
- Express: https://expressjs.com/en/guide/error-handling.html
- MongoDB: https://docs.mongodb.com/manual/

### **Debugging**
- Console logs in frontend
- Check backend logs in `/logs` directory
- Use Postman to test API endpoints
- Check browser DevTools Network tab

---

## 🎯 **Development Workflow**

1. **Start Services** (as shown above)
2. **Make Code Changes**
3. **Test in Simulator/Device**
4. **Commit Changes** (`git commit`)
5. **Push to Repository** (`git push`)
6. **Build for Production** (when ready)
7. **Submit to App Stores**

---

## 🔄 **Update Cycle**

### **For Hotfixes**
1. Fix bug in code
2. Test thoroughly
3. Increment patch version (1.0.X)
4. Rebuild and deploy

### **For New Features**
1. Create feature branch
2. Develop and test
3. Increment minor version (1.X.0)
4. Merge and deploy

### **For Major Releases**
1. Plan features
2. Lengthy testing
3. Increment major version (X.0.0)
4. Large promotion/announcement

---

## 🎓 **Learning Resources**

- [React Native Tutorial](https://reactnative.dev/docs/getting-started)
- [Expo Introduction](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB University](https://university.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: March 8, 2026  
**Version**: 1.0.0
