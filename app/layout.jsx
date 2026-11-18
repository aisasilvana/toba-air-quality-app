import './globals.css';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'Toba Air Quality Monitor',
  description: 'Monitoring kualitas udara Kabupaten Toba – Toba Air Quality IoT Network (IT Del)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
