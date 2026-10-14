import type { Metadata } from "next";
import { Archivo } from "next/font/google";

import "./globals.css";

const font = Archivo({ subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Calado · el Rin en Kaub, por gRPC",
  description: "Taller gRPC: el nivel del Rin en Kaub (Alemania) servido con Protobuf y streaming.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={font.className}>{children}</body>
    </html>
  );
}
