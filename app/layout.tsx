import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'P2P CSV Generator',
  description: 'Generate P2P CSV data with anomaly injection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
