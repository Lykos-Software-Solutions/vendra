import type { MetadataRoute } from "next";

// La home (/) es la demo publica y si se indexa. El resto del panel no aporta
// nada en buscadores: son vistas de datos de ejemplo, formularios de alta y
// edicion, y la pantalla de login. Se bloquea el crawleo antes de que Google
// los descubra siguiendo los enlaces del dashboard.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/pedidos", "/clientes", "/productos", "/login"],
    },
    host: "https://vendra.lykos.com.ar",
  };
}
