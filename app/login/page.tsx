import type { Metadata } from "next";
import { ClipboardList, PackageCheck, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Ingresar · Vendra",
};

function MarcaVendra({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-marca-600">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            d="M6 6l6 12 6-12"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={`font-display text-2xl font-bold tracking-tight ${
          oscuro ? "text-white" : "text-tinta"
        }`}
      >
        Vendra
      </span>
    </div>
  );
}

const claseCampo =
  "w-full rounded-lg bg-carta px-3 py-2.5 text-sm text-tinta ring-1 ring-borde placeholder:text-tinta-3 focus:outline-2 focus:outline-marca-600";

export default function PaginaLogin() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <section className="hidden flex-col justify-between bg-marca-950 p-12 lg:flex">
        <MarcaVendra oscuro />
        <div>
          <h1 className="max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-white">
            La operación de tu pyme, en una sola pantalla.
          </h1>
          <ul className="mt-10 space-y-5">
            <li className="flex items-start gap-3 text-marca-200/90">
              <ClipboardList className="mt-0.5 size-5 shrink-0 text-marca-600" />
              <span>
                Pedidos con seguimiento de estado, desde que entran hasta que se
                entregan.
              </span>
            </li>
            <li className="flex items-start gap-3 text-marca-200/90">
              <PackageCheck className="mt-0.5 size-5 shrink-0 text-marca-600" />
              <span>Control de stock con alertas antes de quedarte sin mercadería.</span>
            </li>
            <li className="flex items-start gap-3 text-marca-200/90">
              <TrendingUp className="mt-0.5 size-5 shrink-0 text-marca-600" />
              <span>Ventas y clientes en métricas claras, sin planillas.</span>
            </li>
          </ul>
        </div>
        <p className="text-sm text-marca-200/50">© 2026 Vendra · Hecho en Argentina</p>
      </section>

      {/* Formulario decorativo: siempre entra */}
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <MarcaVendra />
          </div>
          <h2 className="mt-8 font-display text-2xl font-bold tracking-tight text-tinta lg:mt-0">
            Ingresá a tu cuenta
          </h2>
          <p className="mt-1 text-sm text-tinta-2">
            Demo abierta: entrá directo, sin registrarte.
          </p>

          {/* Sin atributos name: los campos son decorativos y no viajan en la URL */}
          <form action="/" className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-tinta">Email</span>
              <input
                type="email"
                autoComplete="off"
                defaultValue="demo@vendra.com.ar"
                className={claseCampo}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-tinta">
                Contraseña
              </span>
              <input
                type="password"
                autoComplete="off"
                className={claseCampo}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-marca-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            >
              Ingresar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-tinta-3">
            Proyecto de demostración: la autenticación es decorativa.
          </p>
        </div>
      </section>
    </div>
  );
}
