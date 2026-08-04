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
  metadataBase: new URL("https://vendra.lykos.com.ar"),
  title: {
    default: "Vendra · Gestión de Pedidos e Inventario para PYMEs",
    template: "%s · Vendra",
  },
  description:
    "Sistema de gestión de ventas, pedidos, clientes y stock en un solo panel. Demo por Lykos Software Solutions.",
  openGraph: {
    title: "Vendra · Gestión de Pedidos e Inventario para PYMEs",
    description:
      "Sistema de gestión de ventas, pedidos, clientes y stock en un solo panel por Lykos Software Solutions.",
    url: "https://vendra.lykos.com.ar",
    siteName: "Vendra",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendra · Gestión de Pedidos e Inventario para PYMEs",
    description:
      "Sistema de gestión de ventas, pedidos, clientes y stock en un solo panel por Lykos Software Solutions.",
  },
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
