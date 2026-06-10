import "./globals.css";

export const metadata = {
  title: "Fixture Mundial 2026",
  description: "Partidos del Mundial FIFA 2026 en hora Argentina, con goleadores.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
