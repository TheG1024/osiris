import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Osiris',
  description: 'Planetary-scale geospatial intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
