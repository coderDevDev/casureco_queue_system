# Thermal Printer Setup Guide

## Direct Printing to Gprinter GP-1424D

This guide explains how to set up direct thermal printing without browser print dialogs.

## Installation Steps

### 1. Install Printer Library

Run this command in your project directory:

```bash
npm install @thiagoelg/node-printer
```

### 2. Set Gprinter as Default Printer

1. Open **Windows Settings** → **Devices** → **Printers & scanners**
2. Find **Gprinter GP-1424D**
3. Click **Manage** → **Set as default**

### 3. Test the Setup

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/kiosk`

3. Create a test ticket - it should print automatically to your thermal printer!

## How It Works

### Architecture

```
Frontend (React) → API Route (/api/print-ticket) → node-printer → Gprinter GP-1424D
```

### Files Created

1. **`lib/services/printer-service.ts`** - Frontend service to call print API
2. **`app/api/print-ticket/route.ts`** - Backend API that sends ESC/POS commands to printer
3. **`app/api/printer-status/route.ts`** - Check if printer is connected
4. **`components/kiosk/ticket-print.tsx`** - Updated to use direct printing

### ESC/POS Commands

The printer uses ESC/POS (Epson Standard Code for Point of Sale) commands:
- Text formatting (bold, size, alignment)
- Paper cutting
- Direct thermal printing

## Troubleshooting

### Printer Not Found

If you get "printer not found" error:

1. Check printer name in Windows:
   - Open **Control Panel** → **Devices and Printers**
   - Note the exact name of your Gprinter

2. Update printer name in `app/api/print-ticket/route.ts`:
   ```typescript
   const printerName = 'YOUR_EXACT_PRINTER_NAME';
   ```

### Print Not Working

1. **Check printer is online**: Make sure printer is powered on and connected
2. **Check printer status API**: Visit `http://localhost:3000/api/printer-status`
3. **Check console logs**: Look for errors in terminal and browser console

### Alternative: Network Printing

If your Gprinter has an IP address, you can print over network:

```typescript
// In app/api/print-ticket/route.ts
import * as net from 'net';

const client = new net.Socket();
client.connect(9100, '192.168.1.100', () => {  // Your printer IP
  client.write(commands);
  client.end();
});
```

## Features

✅ **Silent Printing** - No browser print dialog
✅ **Auto-Print** - Prints automatically after ticket creation
✅ **ESC/POS** - Professional thermal printer formatting
✅ **Fallback** - Manual "Print Ticket" button still available
✅ **Status Check** - API to verify printer connection

## Production Deployment

For production, consider:

1. **Error Handling**: Add retry logic for failed prints
2. **Queue System**: Queue print jobs if printer is busy
3. **Monitoring**: Log all print jobs for auditing
4. **Backup**: Keep browser printing as fallback option

## Support

If you encounter issues:
- Check Gprinter GP-1424D documentation
- Verify ESC/POS command compatibility
- Test with Gprinter's official software first
