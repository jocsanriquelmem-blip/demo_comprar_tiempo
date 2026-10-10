import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiempo Activo",
  description: "Minutos ganados con movimiento.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tiempo Activo",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
