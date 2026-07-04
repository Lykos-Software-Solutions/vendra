"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

function temaEfectivo(): Tema {
  const forzado = document.documentElement.dataset.theme;
  if (forzado === "claro" || forzado === "oscuro") return forzado;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

// El tema vive fuera de React (data-theme + media query del sistema);
// useSyncExternalStore lo observa y mantiene la hidratación segura:
// el server no conoce el tema, así que su snapshot es null (ícono luna).
function suscribir(notificar: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", notificar);
  const observador = new MutationObserver(notificar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    mq.removeEventListener("change", notificar);
    observador.disconnect();
  };
}

export function TemaToggle() {
  const tema = useSyncExternalStore<Tema | null>(
    suscribir,
    temaEfectivo,
    () => null,
  );

  function alternar() {
    const nuevo: Tema = temaEfectivo() === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {}
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
