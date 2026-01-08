# Library Management System - Setup Instructions

## 📋 Overview
This is a complete library management system with:
- QR code check-in/out system (smart toggle)
- Book borrowing with 2-book limit
- Date-based borrowing rules (2 days Mon-Wed, 4 days Thu)
- Admin and Student dashboards
- Real-time stats tracking

## 🔧 Backend Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install express cors sqlite3 bcryptjs jsonwebtoken
```

### 2. Create Folder Structure

```
backend/
├── server.js
├── db.js
├── middleware/
│   └── auth.js
└── routes/
    ├── users.js
    ├── attendance.js
    └── books.js
```

### 3. Start Backend Server

```bash
node server.js
```

Server will run on `http://localhost:4000`

**Default Admin Login:**
- Student Number: `0000`
- Password: `admin123`

---

## 🎨 Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install react-router-dom qrcode html5-qrcode
```

### 2. File Structure

```
src/
├── App.js
├── pages/
│   ├── login.js
│   ├── signin.js
│   ├── admin.js
│   └── student.js
└── components/
    ├── Navbar.js
    ├── QRCodeOffline.js
    └── QRScanner.js
```

### 3. Start Frontend

```bash
npm start
```

Frontend runs on `http://localhost:3000`

---

## ✅ What's Fixed

### QR Code System
- ✅ Real QR codes using `qrcode` library
- ✅ Auto-downloads immediately (no prompt)
- ✅ QR scanner works with camera
- ✅ Smart check-in/out toggle (auto-detects status)

### Student Dashboard
- ✅ All pages working (Profile, Settings, BookList, History)
- ✅ Quick actions functional
- ✅ Book borrow limit shows **0/2** format
- ✅ Borrowed books display with due dates
- ✅ Date rules implemented:
  - Mon-Wed: 2 days
  - Thu: 4 days
- ✅ Can see borrowed and returned books
- ✅ History shows check-in/out logs

### Admin Dashboard
- ✅ Stats show **10/20** format (checked-in / total)
  - Students: `{checkedIn}/{total registered}`
  - Admins: `{checkedIn}/{total admins}`
- ✅ QR scanner working
- ✅ User management (promote/demote/delete)

---

## 🚀 Features

### For Students
1. **QR Code Generation**
   - Click "Show My QR Code"
   - Auto-downloads PNG file
   - Show to admin for check-in/out

2. **Book Borrowing**
   - Browse available books
   - Max 2 books at a time
   - See borrowed books with due dates
   - Return books easily

3. **History Tracking**
   - View all check-in/out history
   - See borrowed/returned books

### For Admins
1. **QR Scanner**
   - Start camera scanner
   - Scan student QR codes
   - Auto check-in/out based on status
   - Manual entry backup

2. **User Management**
   - View all students/admins
   - Promote students to admin
   - Demote admins to student
   - Delete users (except yourself)

3. **Statistics**
   - Real-time checked-in counts
   - Total registered users
   - Books borrowed
   - Activity tracking

---

## 📱 How to Use

### Student Check-in Process
1. Student logs in
2. Clicks "Show My QR Code"
3. QR downloads automatically
4. Shows QR to admin
5. Admin scans → student checked in

### Book Borrowing Process
1. Student goes to "Book List"
2. Sees **0/2** borrowed count
3. Clicks "Borrow" on available book
4. System checks:
   - Is limit reached? (2 books max)
   - Calculate due date based on day
5. Book added to "My Borrowed Books"
6. Can return anytime

### Due Date Rules
- **Monday to Wednesday**: Borrow for 2 days
- **Thursday**: Borrow for 4 days (until Monday)
- **Friday-Sunday**: Default 2 days

---

## 🗄️ Database Tables

### users
- id, name, email, studentNumber, password, role

### attendance_logs
- id, userId, studentNumber, action, timestamp

### current_status
- userId, studentNumber, checkedIn, lastCheckIn, lastCheckOut

### books
- id, title, author, isbn, available, totalCopies

### borrowed_books
- id, userId, bookId, borrowDate, dueDate, returnDate, status

---

## 🔑 API Endpoints

### Users
- `POST /users/register` - Register new student
- `POST /users/login` - Login
- `GET /users/verify` - Verify token
- `GET /users` - Get all users (admin)
- `DELETE /users/:id` - Delete user (admin)
- `PUT /users/:id/promote` - Promote/demote (admin)

### Attendance
- `POST /attendance/toggle` - Smart check-in/out (admin)
- `GET /attendance/current-count` - Get checked-in count
- `GET /attendance/logs` - Get all logs (admin)
- `GET /attendance/my-history` - Get user's history

### Books
- `GET /books` - Get all books
- `POST /books` - Add book (admin)
- `POST /books/borrow` - Borrow book
- `POST /books/return/:id` - Return book
- `GET /books/my-books` - Get user's borrowed books
- `GET /books/my-stats` - Get borrowing stats

---

## 🐛 Troubleshooting

### QR Code Not Showing
- Check if `qrcode` is installed: `npm install qrcode`
- Clear browser cache

### Scanner Not Working
- Check if `html5-qrcode` is installed: `npm install html5-qrcode`
- Allow camera permissions in browser
- Use manual entry as backup

### Connection Issues
- Make sure backend is running on port 4000
- Check CORS is enabled
- Verify token is stored in localStorage

---

## 📝 Notes

- Default admin cannot delete themselves
- Students can only borrow 2 books at a time
- QR codes are unique per student
- Check-in/out is smart (auto-toggles)
- Due dates calculated automatically
- All stats update in real-time

---

## 🎯 Next Steps (Optional Enhancements)

1. Add PC reservation system
2. Add book search/filter
3. Add overdue notifications
4. Add email notifications
5. Add reports/analytics
6. Add book covers/images
7. Add fine calculation for overdue books

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Verify all dependencies installed
3. Make sure both servers running
4. Check network requests in DevTools