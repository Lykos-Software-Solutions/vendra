"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  LogOut,
} from "lucide-react";
import { TemaToggle } from "./tema-toggle";

const enlaces = [
  { href: "/", etiqueta: "Panel general", Icono: LayoutDashboard },
  { href: "/pedidos", etiqueta: "Pedidos", Icono: ClipboardList },
  { href: "/clientes", etiqueta: "Clientes", Icono: Users },
  { href: "/productos", etiqueta: "Productos", Icono: Package },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-marca-600">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
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
      <span>
        <span className="block font-display text-lg font-bold tracking-tight text-white">
          Vendra
        </span>
        <span className="block text-[11px] leading-tight text-marca-200/70">
          Gestión de pedidos
        </span>
      </span>
    </Link>
  );
}

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-marca-950 px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Principal">
          {enlaces.map(({ href, etiqueta, Icono }) => {
            const activo = esActivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-200 ${
                  activo
                    ? "bg-marca-600/25 text-white"
                    : "text-marca-200/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icono className="size-[18px]" strokeWidth={activo ? 2.2 : 1.8} />
                {etiqueta}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marca-600 text-xs font-semibold text-white">
              FA
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                Facundo Atrio
              </span>
              <span className="block text-[11px] text-marca-200/70">
                Administración
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <TemaToggle />
              <Link
                href="/login"
                title="Cerrar sesión"
                className="rounded-md p-1.5 text-marca-200/70 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Cerrar sesión</span>
              </Link>
            </span>
          </div>
        </div>
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-marca-950 px-4 py-3 md:hidden">
        <Logo />
        <nav className="flex gap-1" aria-label="Principal">
          {enlaces.map(({ href, etiqueta, Icono }) => {
            const activo = esActivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={etiqueta}
                aria-current={activo ? "page" : undefined}
                className={`rounded-lg p-2.5 ${
                  activo
                    ? "bg-marca-600/25 text-white"
                    : "text-marca-200/70 hover:text-white"
                }`}
              >
                <Icono className="size-5" />
                <span className="sr-only">{etiqueta}</span>
              </Link>
            );
          })}
        </nav>
        <TemaToggle />
      </header>
    </>
  );
}
