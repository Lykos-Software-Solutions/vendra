import type { Metadata } from "next";
import { Sora, Instrument_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vendra · Gestión de pedidos",
  description:
    "Sistema de gestión de pedidos para pymes: ventas, clientes, productos y stock en un solo panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${sora.variable} ${instrument.variable}`}>
      <body className="min-h-screen">
        <script
          // Aplica el tema guardado antes del primer paint para evitar flash
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("tema");if(t==="claro"||t==="oscuro")document.documentElement.dataset.theme=t}catch(e){}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
