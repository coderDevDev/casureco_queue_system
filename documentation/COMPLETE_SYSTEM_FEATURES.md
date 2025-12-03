# CASURECO II Queue Management System
## Complete Feature Documentation

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Access](#user-roles--access)
3. [Kiosk Features (Customer-Facing)](#kiosk-features-customer-facing)
4. [Staff Features](#staff-features)
5. [Supervisor Features](#supervisor-features)
6. [Admin Features](#admin-features)
7. [Display System Features](#display-system-features)
8. [Technical Features](#technical-features)

---

## 🎯 System Overview

**CASURECO II Queue Management System** is a comprehensive digital queue management solution designed for CASURECO II (Camarines Sur II Electric Cooperative) to streamline customer service operations across multiple branches.

### Key Capabilities:
- Multi-branch support
- Role-based access control (Admin, Supervisor, Staff, Customer)
- Real-time queue monitoring
- Automated ticket printing
- Digital display boards
- Analytics and reporting
- Customizable branding

---

## 👥 User Roles & Access

### 1. **Customer (Public Access)**
- Access via Kiosk terminals
- No login required
- Self-service ticket generation

### 2. **Staff**
- Counter-level operations
- Queue management
- Customer service

### 3. **Supervisor**
- Branch-level oversight
- Staff monitoring
- Queue optimization
- Reports access

### 4. **Admin**
- System-wide control
- Multi-branch management
- User management
- System configuration

---

## 🖥️ KIOSK FEATURES (Customer-Facing)

### **Purpose**: Self-service ticket generation for customers

### Features:

#### 1. **Service Selection**
- **Visual Service Cards**
  - Color-coded service categories
  - Service prefix display (e.g., C for Cashier, NB for New Business)
  - Large, touch-friendly buttons
  - Service descriptions

#### 2. **Priority Level Selection**
- **Regular Priority**
  - Standard queue position
  - Normal wait time
  - Green indicator

- **Priority (PWD/Senior/Pregnant)**
  - Expedited service
  - Reduced wait time
  - Blue indicator
  - Automatic priority queue placement

- **Emergency**
  - Immediate attention
  - Highest priority
  - Red indicator
  - Jumps to front of queue

#### 3. **Automatic Ticket Printing**
- **Beautiful Ticket Design**
  - Company logo
  - Ticket number (large, bold)
  - Service name
  - Queue position
  - Estimated wait time
  - Time issued
  - Custom header/footer messages
  - Colored borders (customizable)

- **Printing Features**
  - **Ultra-fast printing** (100ms delay)
  - **Automatic trigger** after ticket creation
  - **Kiosk mode support** (silent printing)
  - **Thermal printer compatible** (Gprinter GP-1424D)
  - **Beautiful formatted output**
  - **Manual print button** (backup option)

#### 4. **User Experience**
- **Full-screen kiosk mode**
- **Touch-optimized interface**
- **Auto-reset after 15 seconds**
- **Visual success confirmation**
- **Real-time queue position**
- **Estimated wait time display**

#### 5. **Accessibility**
- Large, readable fonts
- High-contrast colors
- Simple navigation
- Back button support
- Loading states
- Error handling

---

## 👨‍💼 STAFF FEATURES

### **Purpose**: Counter operations and customer service

### Dashboard:

#### 1. **Queue Management**
- **Active Queue View**
  - Current ticket being served
  - Next tickets in queue
  - Priority indicators
  - Service type labels
  - Wait time display

- **Call Next Customer**
  - One-click call button
  - Automatic ticket assignment
  - Status update to "serving"
  - Display board notification

- **Complete Service**
  - Mark ticket as completed
  - Record service duration
  - Update statistics
  - Free up counter

- **Skip/Transfer**
  - Skip no-show customers
  - Transfer to another counter
  - Add notes/reasons

#### 2. **Counter Assignment**
- **My Counter View**
  - Assigned counter number
  - Counter status (Active/Inactive)
  - Services handled
  - Current customer info

- **Counter Controls**
  - Go online/offline
  - Break mode
  - Lunch break
  - End of shift

#### 3. **Service History**
- **Today's Tickets**
  - All tickets served
  - Service times
  - Customer wait times
  - Completion status

- **Search & Filter**
  - By ticket number
  - By service type
  - By time range
  - By status

#### 4. **Performance Stats**
- **Personal Metrics**
  - Tickets served today
  - Average service time
  - Customer satisfaction
  - Efficiency rating

- **Real-time Updates**
  - Live queue count
  - Current wait time
  - Peak hours indicator

---

## 👔 SUPERVISOR FEATURES

### **Purpose**: Branch oversight and optimization

### Dashboard:

#### 1. **Branch Overview**
- **Real-time Monitoring**
  - All active counters
  - Staff status
  - Current queue length
  - Service distribution

- **Queue Analytics**
  - Total tickets today
  - Average wait time
  - Peak hours
  - Service breakdown

#### 2. **Staff Management**
- **Staff Monitoring**
  - Online/offline status
  - Current assignments
  - Performance metrics
  - Break schedules

- **Counter Assignment**
  - Assign staff to counters
  - Reassign during shifts
  - Balance workload
  - Emergency coverage

#### 3. **Queue Optimization**
- **Priority Management**
  - Adjust priority rules
  - Emergency escalation
  - Queue reordering
  - Wait time optimization

- **Service Flow**
  - Monitor bottlenecks
  - Redistribute customers
  - Open/close counters
  - Service time targets

#### 4. **Reports & Analytics**
- **Daily Reports**
  - Tickets processed
  - Service times
  - Staff performance
  - Customer satisfaction

- **Weekly/Monthly Trends**
  - Peak hours analysis
  - Service demand
  - Staff efficiency
  - Wait time trends

#### 5. **Announcements**
- **Branch Announcements**
  - Create messages
  - Display on screens
  - Schedule announcements
  - Emergency alerts

---

## 🔧 ADMIN FEATURES

### **Purpose**: System-wide management and configuration

### Dashboard:

#### 1. **System Overview**
- **Global Statistics**
  - Total branches
  - Total users
  - Total counters
  - Total services
  - Tickets today (all branches)
  - Average wait time (system-wide)

- **Trend Indicators**
  - Month-over-month growth
  - Performance metrics
  - System health

#### 2. **Branch Management**
- **Branch Operations**
  - Create new branches
  - Edit branch details
  - Activate/deactivate branches
  - Branch configuration

- **Branch Information**
  - Branch name
  - Location/address
  - Contact information
  - Operating hours
  - Timezone settings

#### 3. **User Management**
- **User Administration**
  - Create user accounts
  - Assign roles (Admin, Supervisor, Staff)
  - Assign to branches
  - Activate/deactivate users

- **User Details**
  - Full name
  - Email
  - Role
  - Branch assignment
  - Status (Active/Inactive)
  - Last login

- **Bulk Operations**
  - Import users
  - Export user list
  - Mass updates

#### 4. **Service Management**
- **Service Configuration**
  - Create services
  - Edit service details
  - Set service colors
  - Define service prefixes
  - Estimated service time
  - Service categories

- **Service Settings**
  - Service name
  - Service code/prefix
  - Color coding
  - Icon selection
  - Priority rules
  - Branch assignment

#### 5. **Counter Management**
- **Counter Setup**
  - Create counters
  - Assign to branches
  - Set counter numbers
  - Configure services per counter
  - Counter status

- **Counter Configuration**
  - Counter name/number
  - Assigned services
  - Branch location
  - Active status

#### 6. **Branding & Customization**
- **Company Branding**
  - Upload company logo
  - Set primary color
  - Set secondary color
  - Ticket border color
  - Custom color schemes

- **Ticket Customization**
  - Company name
  - Header text
  - Footer text
  - Logo on ticket (toggle)
  - Ticket layout

- **Display Customization**
  - Display theme
  - Font sizes
  - Color schemes
  - Animation settings

#### 7. **System Settings**
- **General Settings**
  - System name
  - Default timezone
  - Date format
  - Time format
  - Language settings

- **Queue Settings**
  - Auto-call interval
  - Priority weights
  - Wait time calculation
  - Ticket expiry time

- **Notification Settings**
  - Email notifications
  - SMS settings
  - Display alerts
  - Sound notifications

#### 8. **Reports & Analytics**
- **Comprehensive Reports**
  - Daily reports (all branches)
  - Weekly summaries
  - Monthly analytics
  - Custom date ranges

- **Report Types**
  - **Service Reports**
    - Tickets per service
    - Service demand trends
    - Peak service times
  
  - **Performance Reports**
    - Staff efficiency
    - Counter utilization
    - Average service times
    - Customer wait times
  
  - **Branch Reports**
    - Branch comparison
    - Branch performance
    - Resource allocation
  
  - **Custom Reports**
    - Date range selection
    - Filter by branch
    - Filter by service
    - Export to CSV/PDF

#### 9. **Announcements Management**
- **System-wide Announcements**
  - Create announcements
  - Schedule display
  - Target specific branches
  - Priority levels
  - Expiry dates

- **Announcement Types**
  - General information
  - Service updates
  - Emergency alerts
  - Maintenance notices

---

## 📺 DISPLAY SYSTEM FEATURES

### **Purpose**: Public queue display boards

### Features:

#### 1. **Now Serving Display**
- **Large Ticket Display**
  - Current ticket number
  - Counter number
  - Service type
  - Color-coded display

- **Multiple Tickets**
  - Show multiple active tickets
  - Different counters
  - Real-time updates

#### 2. **Queue Information**
- **Waiting List**
  - Next tickets in queue
  - Estimated wait times
  - Priority indicators

#### 3. **Announcements**
- **Scrolling Messages**
  - Branch announcements
  - Service updates
  - Important notices
  - Emergency alerts

#### 4. **Branding**
- **Company Identity**
  - Logo display
  - Brand colors
  - Custom styling

#### 5. **Real-time Updates**
- **Live Synchronization**
  - Instant ticket updates
  - Counter status changes
  - Queue movements
  - Announcement changes

#### 6. **Display Modes**
- **Full-screen mode**
- **Auto-refresh**
- **Sound notifications** (optional)
- **Visual alerts**

---

## 🔧 TECHNICAL FEATURES

### 1. **Authentication & Security**
- **Supabase Authentication**
  - Email/password login
  - Secure session management
  - Role-based access control
  - Password encryption

- **Authorization**
  - Route protection
  - Role verification
  - Branch-level permissions
  - Action-level permissions

### 2. **Real-time Capabilities**
- **Supabase Realtime**
  - Live queue updates
  - Instant ticket changes
  - Counter status sync
  - Display board updates

- **Optimistic Updates**
  - Immediate UI feedback
  - Background synchronization
  - Conflict resolution

### 3. **Database Architecture**
- **Supabase PostgreSQL**
  - Relational data model
  - Foreign key constraints
  - Indexes for performance
  - Row-level security

- **Tables**
  - Users
  - Branches
  - Services
  - Counters
  - Tickets
  - Queue
  - Announcements
  - Branding settings

### 4. **State Management**
- **Zustand Stores**
  - Global state
  - User state
  - Queue state
  - UI state

- **React Hooks**
  - Custom hooks
  - Data fetching
  - Real-time subscriptions

### 5. **UI/UX Framework**
- **Next.js 14**
  - App router
  - Server components
  - Client components
  - API routes

- **Tailwind CSS**
  - Utility-first styling
  - Responsive design
  - Custom theme
  - Dark mode support

- **shadcn/ui Components**
  - Accessible components
  - Customizable
  - Consistent design
  - Form controls

### 6. **Printing System**
- **Browser Printing**
  - Chrome kiosk mode
  - Auto-print support
  - Print preview
  - Custom print styles

- **Thermal Printer Support**
  - Gprinter GP-1424D
  - ESC/POS commands
  - Windows printing API
  - Direct printer communication

### 7. **Performance Optimization**
- **Code Splitting**
  - Route-based splitting
  - Component lazy loading
  - Dynamic imports

- **Caching**
  - Browser caching
  - API response caching
  - Static asset caching

- **Image Optimization**
  - Next.js Image component
  - Lazy loading
  - Responsive images

### 8. **Error Handling**
- **User-friendly Errors**
  - Toast notifications
  - Error boundaries
  - Fallback UI
  - Retry mechanisms

- **Logging**
  - Console logging
  - Error tracking
  - Performance monitoring

### 9. **Responsive Design**
- **Multi-device Support**
  - Desktop (admin/staff)
  - Tablet (kiosk)
  - Mobile (responsive)
  - Large displays (queue boards)

### 10. **Accessibility**
- **WCAG Compliance**
  - Keyboard navigation
  - Screen reader support
  - High contrast mode
  - Focus indicators

---

## 📊 WORKFLOW EXAMPLES

### Customer Journey:
1. Customer approaches kiosk
2. Selects service (e.g., "Cashier")
3. Selects priority level (e.g., "Regular")
4. Ticket automatically prints
5. Customer sees ticket number and queue position
6. Customer waits in waiting area
7. Ticket number appears on display board
8. Customer proceeds to assigned counter
9. Staff serves customer
10. Ticket marked as completed

### Staff Workflow:
1. Staff logs in
2. Selects assigned counter
3. Goes online/active
4. Clicks "Call Next"
5. Customer ticket appears
6. Serves customer
7. Clicks "Complete"
8. Repeats for next customer

### Supervisor Workflow:
1. Supervisor logs in
2. Views branch dashboard
3. Monitors queue length
4. Checks staff performance
5. Reassigns staff if needed
6. Creates announcements
7. Reviews daily reports

### Admin Workflow:
1. Admin logs in
2. Views system dashboard
3. Manages branches
4. Creates/manages users
5. Configures services
6. Customizes branding
7. Generates reports
8. System maintenance

---

## 🎨 Customization Features

### Branding:
- ✅ Custom logo upload
- ✅ Primary color selection
- ✅ Secondary color selection
- ✅ Ticket border color
- ✅ Company name
- ✅ Custom header/footer text
- ✅ Logo on ticket toggle

### Services:
- ✅ Custom service names
- ✅ Service color coding
- ✅ Service prefixes
- ✅ Service icons
- ✅ Estimated service time

### Display:
- ✅ Custom themes
- ✅ Font customization
- ✅ Color schemes
- ✅ Layout options

---

## 📈 Reporting Capabilities

### Available Reports:
1. **Daily Summary**
   - Total tickets
   - Tickets per service
   - Average wait time
   - Average service time
   - Peak hours

2. **Staff Performance**
   - Tickets served per staff
   - Average service time per staff
   - Efficiency ratings
   - Break time analysis

3. **Service Analysis**
   - Most requested services
   - Service demand trends
   - Service time analysis
   - Priority distribution

4. **Branch Comparison**
   - Multi-branch metrics
   - Performance comparison
   - Resource utilization
   - Customer flow

5. **Custom Reports**
   - Date range selection
   - Multiple filters
   - Export options (CSV, PDF)
   - Scheduled reports

---

## 🚀 Key Highlights

### For Customers:
- ✅ Fast, self-service ticket generation
- ✅ Clear queue position visibility
- ✅ Estimated wait time
- ✅ Priority options for special needs
- ✅ Professional printed tickets

### For Staff:
- ✅ Simple, intuitive interface
- ✅ One-click customer calling
- ✅ Real-time queue visibility
- ✅ Performance tracking
- ✅ Easy counter management

### For Supervisors:
- ✅ Complete branch oversight
- ✅ Staff monitoring
- ✅ Queue optimization tools
- ✅ Comprehensive reports
- ✅ Announcement system

### For Admins:
- ✅ Multi-branch management
- ✅ User administration
- ✅ System-wide configuration
- ✅ Advanced analytics
- ✅ Complete customization

---

## 💡 System Benefits

1. **Reduced Wait Times**
   - Optimized queue management
   - Priority handling
   - Efficient staff allocation

2. **Improved Customer Experience**
   - Clear communication
   - Fair queue system
   - Reduced perceived wait time
   - Professional service

3. **Increased Efficiency**
   - Automated processes
   - Real-time monitoring
   - Data-driven decisions
   - Resource optimization

4. **Better Management**
   - Comprehensive analytics
   - Performance tracking
   - Informed decision-making
   - Accountability

5. **Scalability**
   - Multi-branch support
   - Easy expansion
   - Flexible configuration
   - Future-proof architecture

---

## 📱 Deployment Options

### Kiosk Terminals:
- Windows PC with touchscreen
- Chrome browser in kiosk mode
- Thermal printer (Gprinter GP-1424D)
- Auto-start on boot

### Staff Workstations:
- Desktop/laptop computers
- Modern web browser
- Network connectivity

### Display Boards:
- Large screen TVs/monitors
- Web browser (auto-refresh)
- Network connectivity

### Admin Access:
- Any device with web browser
- Secure internet connection
- Role-based access

---

**System Version**: 1.0  
**Last Updated**: December 3, 2025  
**Developed for**: CASURECO II (Camarines Sur II Electric Cooperative)
