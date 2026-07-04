"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

function temaEfectivo(): Tema {
  const forzado = document.documentElement.dataset.theme;
  if (forzado === "claro" || forzado === "oscuro") return forzado;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function TemaToggle() {
  // Arranca en null para que el HTML del server coincida en la hidratación
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaEfectivo());
  }, []);

  function alternar() {
    const nuevo: Tema = temaEfectivo() === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {}
    setTema(nuevo);
  }

  const etiqueta =
    tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={alternar}
      title={etiqueta}
      className="rounded-md p-1.5 text-marca-200/70 hover:bg-white/5 hover:text-white"
    >
      {tema === "oscuro" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">{etiqueta}</span>
    </button>
  );
}
