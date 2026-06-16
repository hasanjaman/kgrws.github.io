import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Image Question Extractor',
  description: 'Extract and format question paper text from images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
