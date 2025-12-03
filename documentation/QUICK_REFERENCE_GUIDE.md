# CASURECO II Queue Management System
## Quick Reference Guide

---

## 🚀 Quick Start

### System Access URLs:
```
Kiosk:        http://localhost:3000/kiosk
Display:      http://localhost:3000/display
Staff Login:  http://localhost:3000/login
Admin Login:  http://localhost:3000/login
```

---

## 👥 USER ROLES QUICK REFERENCE

### 🎫 CUSTOMER (Kiosk)
**Access**: Walk-up kiosk terminal  
**No login required**

| Action | Steps |
|--------|-------|
| Get a ticket | 1. Select service<br>2. Select priority<br>3. Take printed ticket |
| Check queue position | Look at ticket or display board |

---

### 👨‍💼 STAFF
**Access**: Login → Staff Dashboard

| Action | Steps |
|--------|-------|
| Start shift | Login → Select counter → Go online |
| Call next customer | Click "Call Next" button |
| Serve customer | View customer info → Provide service |
| Complete service | Click "Complete" button |
| Take break | Click "Go Offline" or "Break Mode" |
| View queue | Check "Queue" tab |
| View history | Check "History" tab |
| End shift | Click "Go Offline" → Logout |

**Keyboard Shortcuts:**
- `Ctrl + N` - Call Next (if enabled)
- `Ctrl + C` - Complete Service (if enabled)

---

### 👔 SUPERVISOR
**Access**: Login → Supervisor Dashboard

| Action | Steps |
|--------|-------|
| Monitor branch | View dashboard overview |
| Check staff status | Go to Staff Monitoring |
| View queue | Check Queue Management |
| Reassign staff | Staff → Select staff → Reassign counter |
| Create announcement | Announcements → Create New |
| View reports | Reports → Select date range → Generate |
| Optimize queue | Queue Management → Adjust priorities |

**Key Metrics to Monitor:**
- Current queue length
- Average wait time
- Staff utilization
- Service distribution

---

### 🔧 ADMIN
**Access**: Login → Admin Dashboard

| Action | Steps |
|--------|-------|
| **Branch Management** | |
| Add branch | Branches → Add Branch → Fill form → Save |
| Edit branch | Branches → Select branch → Edit → Save |
| Deactivate branch | Branches → Select branch → Toggle status |
| **User Management** | |
| Create user | Users → Add User → Fill details → Assign role → Save |
| Edit user | Users → Select user → Edit → Save |
| Reset password | Users → Select user → Reset Password |
| Deactivate user | Users → Select user → Toggle status |
| **Service Management** | |
| Create service | Services → Add Service → Fill details → Save |
| Edit service | Services → Select service → Edit → Save |
| Set service color | Services → Edit → Choose color → Save |
| **Counter Management** | |
| Create counter | Counters → Add Counter → Assign branch → Save |
| Assign services | Counters → Edit → Select services → Save |
| **Branding** | |
| Upload logo | Branding → Upload Logo → Select file → Save |
| Set colors | Branding → Color pickers → Save |
| Customize ticket | Branding → Edit text fields → Save |
| **Reports** | |
| Daily report | Reports → Daily → Select date → Generate |
| Custom report | Reports → Custom → Set filters → Generate |
| Export report | Generate report → Export CSV/PDF |
| **System Settings** | |
| Update settings | Settings → Edit → Save |

---

## 📊 FEATURE MATRIX

| Feature | Customer | Staff | Supervisor | Admin |
|---------|----------|-------|------------|-------|
| Generate ticket | ✅ | ❌ | ❌ | ❌ |
| Call customer | ❌ | ✅ | ✅ | ❌ |
| Complete service | ❌ | ✅ | ✅ | ❌ |
| View queue | ✅ | ✅ | ✅ | ✅ |
| Monitor staff | ❌ | ❌ | ✅ | ✅ |
| Create announcements | ❌ | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage branches | ❌ | ❌ | ❌ | ✅ |
| Customize branding | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

---

## 🎨 PRIORITY LEVELS

| Priority | Color | Use Case | Queue Position |
|----------|-------|----------|----------------|
| Regular | 🟢 Green | Standard customers | Normal order |
| Priority | 🔵 Blue | PWD, Senior, Pregnant | Moved up in queue |
| Emergency | 🔴 Red | Urgent matters | Front of queue |

---

## 🖨️ KIOSK PRINTING SETUP

### Quick Setup:
1. Set Gprinter GP-1424D as **default printer**
2. Run: `npm run dev`
3. Launch: `launch-kiosk.bat`
4. Test by creating a ticket

### Troubleshooting:
| Problem | Solution |
|---------|----------|
| No print | Check printer is ON and default |
| Blank print | Verify printer has paper |
| Print preview shows | Normal - auto-prints in kiosk mode |
| Slow printing | Already optimized to 100ms |

---

## 📺 DISPLAY BOARD SETUP

### Setup Steps:
1. Open browser on display screen
2. Navigate to: `http://localhost:3000/display`
3. Press F11 for fullscreen
4. Display updates automatically

### Display Shows:
- Current tickets being served
- Counter numbers
- Service types
- Announcements
- Company branding

---

## 🔐 SECURITY & ACCESS

### Password Requirements:
- Minimum 8 characters
- Mix of letters and numbers recommended
- Changed regularly

### Role Permissions:
```
Admin > Supervisor > Staff > Customer
```

### Session Management:
- Auto-logout after inactivity
- Secure session tokens
- One session per user

---

## 📱 DEVICE REQUIREMENTS

### Kiosk Terminal:
- **OS**: Windows 10/11
- **Screen**: Touchscreen (recommended)
- **Browser**: Chrome (latest)
- **Printer**: Gprinter GP-1424D or compatible
- **Connection**: Stable internet

### Staff Workstation:
- **OS**: Windows/Mac/Linux
- **Browser**: Chrome, Firefox, Edge (latest)
- **Connection**: Stable internet

### Display Board:
- **Device**: PC, Smart TV, or display with browser
- **Browser**: Any modern browser
- **Connection**: Stable internet

### Admin Access:
- **Device**: Any with web browser
- **Browser**: Modern browser
- **Connection**: Secure internet

---

## 🔄 COMMON WORKFLOWS

### Customer Gets Service:
```
1. Customer → Kiosk
2. Select service
3. Select priority
4. Get ticket (auto-prints)
5. Wait for number on display
6. Go to assigned counter
7. Receive service
8. Done
```

### Staff Serves Customer:
```
1. Login
2. Select counter
3. Go online
4. Click "Call Next"
5. Customer appears
6. Serve customer
7. Click "Complete"
8. Repeat
```

### Supervisor Monitors Branch:
```
1. Login
2. View dashboard
3. Check queue length
4. Monitor staff
5. Adjust as needed
6. Generate reports
7. Create announcements
```

### Admin Manages System:
```
1. Login
2. View system stats
3. Manage branches/users
4. Configure services
5. Customize branding
6. Review reports
7. Update settings
```

---

## 📊 KEY METRICS EXPLAINED

### Queue Position:
- Your place in line
- Updates in real-time
- Affected by priority level

### Estimated Wait Time:
- Calculated from:
  - Current queue length
  - Average service time
  - Active counters
  - Priority level

### Average Service Time:
- Time to serve one customer
- Varies by service type
- Used for wait time calculation

### Staff Efficiency:
- Tickets served per hour
- Average service time
- Compared to branch average

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**Cannot login:**
- Check username/password
- Verify account is active
- Contact admin

**Ticket not printing:**
- Check printer power
- Verify printer is default
- Check paper supply
- Restart kiosk

**Display not updating:**
- Refresh browser (F5)
- Check internet connection
- Verify display URL

**Queue not moving:**
- Check staff are online
- Verify counters are active
- Contact supervisor

**Reports not generating:**
- Check date range
- Verify permissions
- Try different browser

---

## 📞 SUPPORT CONTACTS

### Technical Support:
- **Email**: support@casureco.com
- **Phone**: [Your phone number]
- **Hours**: 8:00 AM - 5:00 PM

### Admin Support:
- **Email**: admin@casureco.com
- **Phone**: [Your phone number]

### Emergency:
- **Contact**: [Emergency contact]
- **Available**: 24/7

---

## 📚 ADDITIONAL RESOURCES

### Documentation:
- `COMPLETE_SYSTEM_FEATURES.md` - Full feature list
- `DEMO_SCRIPT.md` - Demo presentation guide
- `PRINTER_SETUP.md` - Detailed printer setup
- `KIOSK_SETUP_GUIDE.txt` - Kiosk configuration

### Training Materials:
- User manuals (by role)
- Video tutorials
- Quick start guides
- FAQ documents

---

## 🔄 SYSTEM UPDATES

### Update Schedule:
- **Minor updates**: Monthly
- **Major updates**: Quarterly
- **Security patches**: As needed

### Update Process:
1. Notification sent to admins
2. Scheduled maintenance window
3. System updated
4. Testing performed
5. Users notified

---

## 💡 TIPS & BEST PRACTICES

### For Staff:
- ✅ Go online promptly at shift start
- ✅ Call next customer immediately after completing service
- ✅ Use break mode for short breaks
- ✅ Go offline at end of shift

### For Supervisors:
- ✅ Monitor queue length regularly
- ✅ Redistribute staff during peak hours
- ✅ Review daily reports
- ✅ Create timely announcements

### For Admins:
- ✅ Regular system backups
- ✅ Review user access periodically
- ✅ Update branding seasonally
- ✅ Analyze reports for insights

### For Customers:
- ✅ Keep your ticket
- ✅ Watch the display board
- ✅ Arrive at counter when called
- ✅ Have documents ready

---

## 🎯 QUICK TIPS

💡 **Did you know?**
- You can export reports to CSV for Excel analysis
- Custom announcements can be scheduled
- Services can have different colors per branch
- Staff performance is tracked automatically
- The system works on tablets and phones too

---

**Last Updated**: December 3, 2025  
**Version**: 1.0  
**For**: CASURECO II Queue Management System
