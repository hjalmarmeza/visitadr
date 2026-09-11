import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Visita al Doctor",
  description: "Asistente médico para la familia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Aplicamos el fondo fresco (Azul a Teal) globalmente para que toda la app lo tenga, no solo el login */}
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-teal-50/40 to-[#f3f7fb] text-slate-800 relative min-h-screen selection:bg-teal-200`}>
        {children}
      </body>
    </html>
  );
}
