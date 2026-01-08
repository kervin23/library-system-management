# Complete File Structure

## 📁 Backend Files

```
backend/
│
├── server.js                    ✅ UPDATED - mount all routes
├── db.js                        ✅ NEW - complete database schema
├── package.json                 ✅ NEW - with all dependencies
│
├── middleware/
│   └── auth.js                  ✅ NEW - JWT authentication
│
└── routes/
    ├── users.js                 ✅ KEEP YOUR EXISTING FILE
    ├── attendance.js            ✅ NEW - check-in/out system
    └── books.js                 ✅ NEW - book borrowing system
```

## 📁 Frontend Files

```
frontend/
│
├── package.json                 ✅ ADD: qrcode, html5-qrcode, react-router-dom
│
└── src/
    ├── App.js                   ✅ KEEP EXISTING
    ├── index.js                 ✅ KEEP EXISTING
    ├── index.css                ✅ KEEP EXISTING
    │
    ├── pages/
    │   ├── login.js             ✅ KEEP EXISTING
    │   ├── signin.js            ✅ KEEP EXISTING
    │   ├── admin.js             ✅ REPLACE with updated version
    │   └── student.js           ✅ REPLACE with updated version
    │
    └── components/
        ├── Navbar.js            ✅ KEEP EXISTING
        ├── QRCodeOffline.js     ✅ REPLACE with fixed version
        └── QRScanner.js         ✅ REPLACE with fixed version
```

---

## 🔄 Files to Replace

### Backend
1. **server.js** → Replace with updated version (adds new routes)
2. **db.js** → Replace completely (new schema with all tables)
3. **Create new folder:** `middleware/`
4. **Create new file:** `middleware/auth.js`
5. **Create new file:** `routes/attendance.js`
6. **Create new file:** `routes/books.js`
7. **Keep:** `routes/users.js` (your existing file is fine)

### Frontend
1. **student.js** → Replace with complete updated version
2. **admin.js** → Replace with updated version (proper stats)
3. **QRCodeOffline.js** → Replace with fixed version (real QR + auto-download)
4. **QRScanner.js** → Replace with fixed version (working scanner)
5. **Keep:** Navbar.js, login.js, signin.js, App.js (all fine)

---

## 📦 Installation Commands

### Backend
```bash
cd backend
npm install express cors sqlite3 bcryptjs jsonwebtoken
npm install -D nodemon  # Optional, for auto-restart
```

### Frontend
```bash
cd frontend  
npm install react-router-dom qrcode html5-qrcode
```

---

## 🚀 Quick Start

### Step 1: Setup Backend
```bash
cd backend
npm install
node server.js
```
✅ Server running on http://localhost:4000

### Step 2: Setup Frontend
```bash
cd frontend
npm install
npm start
```
✅ Frontend running on http://localhost:3000

### Step 3: Login
- Go to http://localhost:3000
- Login as admin:
  - Student Number: `0000`
  - Password: `admin123`

---

## ✅ Verification Checklist

### Backend
- [ ] All dependencies installed
- [ ] `db.js` creates all 5 tables
- [ ] `middleware/auth.js` exists
- [ ] `routes/attendance.js` exists
- [ ] `routes/books.js` exists
- [ ] Server starts without errors
- [ ] Can see "Available routes" in console

### Frontend  
- [ ] `qrcode` package installed
- [ ] `html5-qrcode` package installed
- [ ] `react-router-dom` installed
- [ ] Updated `student.js` in place
- [ ] Updated `admin.js` in place
- [ ] Updated `QRCodeOffline.js` in place
- [ ] Updated `QRScanner.js` in place
- [ ] App starts without errors

### Functionality
- [ ] Can login as admin (0000 / admin123)
- [ ] Can register new student
- [ ] Student can generate QR (auto-downloads)
- [ ] Admin can scan QR (camera opens)
- [ ] Manual entry works in scanner
- [ ] Check-in/out toggles correctly
- [ ] Stats show "X/Y" format
- [ ] Student can browse books
- [ ] Can borrow books (2 max)
- [ ] Due dates calculated correctly
- [ ] History shows logs
- [ ] All pages load without errors

---

## 🎯 Key Features Working

### QR Code System ✅
- Real QR generation (not placeholder)
- Auto-downloads PNG file
- Scanner uses camera
- Smart toggle (auto check-in/out)
- Manual entry backup

### Book System ✅
- 2-book limit enforced
- Shows "0/2" borrowed count
- Date rules (2 days Mon-Wed, 4 days Thu)
- Can view borrowed books
- Can return books
- Stats updated real-time

### Dashboard Stats ✅
- Students: "10/20" (checked-in / total)
- Admins: "0/5" (checked-in / total)
- Books borrowed count
- History tracking

---

## 📝 Important Notes

1. **QR Code Format:** `STUDENT:{userId}:{studentNumber}`
2. **Token Storage:** localStorage with 7-day expiry
3. **Default Admin:** Cannot delete/demote self
4. **Book Limit:** Hard-coded at 2 books
5. **Due Dates:** Auto-calculated based on day
6. **Check-in:** Smart toggle, no separate buttons

---

## 🐛 Common Issues & Fixes

### "Cannot find module 'qrcode'"
```bash
cd frontend
npm install qrcode
```

### "Cannot find module 'html5-qrcode'"  
```bash
cd frontend
npm install html5-qrcode
```

### Camera not working
- Check browser permissions
- Use manual entry instead
- Try different browser

### Stats showing 0/0
- Backend might not be running
- Check network tab for errors
- Verify token in localStorage

### QR not downloading
- Check browser download settings
- Try different browser
- Check console for errors

---

## 🎉 You're All Set!

Your library management system should now have:
- ✅ Working QR code generation & scanning
- ✅ Smart check-in/out system  
- ✅ Book borrowing with limits
- ✅ Proper stats (X/Y format)
- ✅ All student pages working
- ✅ Complete admin dashboard

Need help? Check the console for errors or refer to SETUP_INSTRUCTIONS.md!