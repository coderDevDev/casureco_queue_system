import { AuthProvider } from '@/lib/hooks/use-auth';
import { RealtimeProvider } from '@/components/providers/realtime-provider';
import { ConnectionStatus } from '@/components/queue/connection-status';
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <ConnectionStatus />
            <Toaster position="top-right" richColors />
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}