import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SweatBot - מאמן כושר AI בעברית',
  description: 'מאמן כושר אישי שלומד את ההעדפות שלך',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}