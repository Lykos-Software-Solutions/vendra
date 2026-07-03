import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// RNG determinístico para que el seed sea reproducible
function mulberry32(semilla: number) {
  return function () {
    let t = (semilla += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = mulberry32(20260703);

function entre(min: number, max: number) {
  return Math.floor(azar() * (max - min + 1)) + min;
}

function elegir<T>(lista: T[]): T {
  return lista[Math.floor(azar() * lista.length)];
}

const productos = [
  { sku: "YER-001", nombre: "Yerba mate orgánica 1 kg", categoria: "Infusiones", precio: 8900, stock: 120, stockMinimo: 30 },
  { sku: "ALF-002", nombre: "Alfajores de maicena x 12", categoria: "Dulces", precio: 12400, stock: 8, stockMinimo: 25 },
  { sku: "DDL-003", nombre: "Dulce de leche clásico 450 g", categoria: "Dulces", precio: 5600, stock: 64, stockMinimo: 20 },
  { sku: "MIE-004", nombre: "Miel de monte 500 g", categoria: "Almacén", precio: 7200, stock: 41, stockMinimo: 15 },
  { sku: "ACE-005", nombre: "Aceite de oliva virgen extra 500 ml", categoria: "Almacén", precio: 14800, stock: 5, stockMinimo: 18 },
  { sku: "VIN-006", nombre: "Vino malbec reserva 750 ml", categoria: "Bebidas", precio: 19500, stock: 96, stockMinimo: 24 },
  { sku: "CAF-007", nombre: "Café de especialidad tostado 250 g", categoria: "Infusiones", precio: 11300, stock: 22, stockMinimo: 20 },
  { sku: "TEH-008", nombre: "Té en hebras frutos rojos 100 g", categoria: "Infusiones", precio: 6800, stock: 57, stockMinimo: 15 },
  { sku: "GAL-009", nombre: "Galletitas de avena x 24", categoria: "Dulces", precio: 9200, stock: 14, stockMinimo: 30 },
  { sku: "MER-010", nombre: "Mermelada de frutilla 454 g", categoria: "Dulces", precio: 6100, stock: 73, stockMinimo: 20 },
  { sku: "HAR-011", nombre: "Harina integral molida a piedra 1 kg", categoria: "Almacén", precio: 3900, stock: 150, stockMinimo: 40 },
  { sku: "GRA-012", nombre: "Granola artesanal 500 g", categoria: "Almacén", precio: 8400, stock: 36, stockMinimo: 15 },
  { sku: "SAL-013", nombre: "Salsa de tomate orgánica 520 g", categoria: "Almacén", precio: 4700, stock: 88, stockMinimo: 25 },
  { sku: "QUE-014", nombre: "Queso sardo estacionado 1 kg", categoria: "Lácteos", precio: 22600, stock: 11, stockMinimo: 10 },
  { sku: "FID-015", nombre: "Fideos tallarín al huevo 500 g", categoria: "Almacén", precio: 4200, stock: 132, stockMinimo: 35 },
];

const clientes = [
  { nombre: "Valentina Sosa", ciudad: "Rosario", provincia: "Santa Fe" },
  { nombre: "Joaquín Pereyra", ciudad: "Córdoba", provincia: "Córdoba" },
  { nombre: "Camila Fernández", ciudad: "La Plata", provincia: "Buenos Aires" },
  { nombre: "Mateo Giménez", ciudad: "CABA", provincia: "Buenos Aires" },
  { nombre: "Martina Ledesma", ciudad: "Mendoza", provincia: "Mendoza" },
  { nombre: "Santiago Acosta", ciudad: "Mar del Plata", provincia: "Buenos Aires" },
  { nombre: "Lucía Benítez", ciudad: "San Miguel de Tucumán", provincia: "Tucumán" },
  { nombre: "Tomás Villalba", ciudad: "Salta", provincia: "Salta" },
  { nombre: "Julieta Molina", ciudad: "Neuquén", provincia: "Neuquén" },
  { nombre: "Franco Ríos", ciudad: "Bahía Blanca", provincia: "Buenos Aires" },
  { nombre: "Agustina Herrera", ciudad: "Paraná", provincia: "Entre Ríos" },
  { nombre: "Nicolás Cabrera", ciudad: "Santa Fe", provincia: "Santa Fe" },
  { nombre: "Sofía Aguirre", ciudad: "San Juan", provincia: "San Juan" },
  { nombre: "Bautista Núñez", ciudad: "Posadas", provincia: "Misiones" },
  { nombre: "Delfina Romero", ciudad: "CABA", provincia: "Buenos Aires" },
  { nombre: "Ignacio Vera", ciudad: "Resistencia", provincia: "Chaco" },
  { nombre: "Milagros Coronel", ciudad: "Corrientes", provincia: "Corrientes" },
  { nombre: "Lautaro Ojeda", ciudad: "San Luis", provincia: "San Luis" },
  { nombre: "Catalina Suárez", ciudad: "Río Cuarto", provincia: "Córdoba" },
  { nombre: "Facundo Medina", ciudad: "Tandil", provincia: "Buenos Aires" },
];

function emailDe(nombre: string) {
  return (
    nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".") + "@example.com"
  );
}

async function main() {
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.cliente.deleteMany();

  const productosCreados = [];
  for (const p of productos) {
    productosCreados.push(await prisma.producto.create({ data: p }));
  }

  const clientesCreados = [];
  for (const c of clientes) {
    clientesCreados.push(
      await prisma.cliente.create({
        data: {
          ...c,
          email: emailDe(c.nombre),
          telefono: `+54 9 11 ${entre(4000, 7999)}-${entre(1000, 9999)}`,
          cuit: `20-${entre(20000000, 45999999)}-${entre(0, 9)}`,
        },
      }),
    );
  }

  // 60 pedidos distribuidos en los últimos 90 días, con más actividad reciente
  const ahora = new Date();
  const fechas: Date[] = [];
  for (let i = 0; i < 60; i++) {
    // sesgo hacia fechas recientes para que el gráfico de 30 días se vea poblado
    const diasAtras = Math.floor(Math.pow(azar(), 1.4) * 90);
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() - diasAtras);
    fecha.setHours(entre(9, 19), entre(0, 59), 0, 0);
    fechas.push(fecha);
  }
  fechas.sort((a, b) => a.getTime() - b.getTime());

  const notasPosibles = [
    null,
    null,
    null,
    "Entregar por la mañana",
    "El cliente pidió factura A",
    "Dejar en portería",
    "Coordinar entrega por WhatsApp",
    null,
    "Embalar para regalo",
    null,
  ];

  for (let i = 0; i < 60; i++) {
    const fecha = fechas[i];
    const diasAtras = Math.floor(
      (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24),
    );

    // estado según antigüedad: los viejos ya se entregaron, los nuevos están en curso
    let estado: string;
    if (diasAtras > 21) {
      estado = azar() < 0.94 ? "ENTREGADO" : "ENVIADO";
    } else if (diasAtras > 10) {
      estado = elegir(["ENTREGADO", "ENTREGADO", "ENTREGADO", "ENVIADO"]);
    } else if (diasAtras > 4) {
      estado = elegir(["ENTREGADO", "ENVIADO", "ENVIADO", "EN_PREPARACION"]);
    } else {
      estado = elegir(["PENDIENTE", "PENDIENTE", "EN_PREPARACION", "ENVIADO"]);
    }

    const cliente = elegir(clientesCreados);
    const cantidadItems = entre(1, 5);
    const usados = new Set<number>();
    const items: { productoId: number; cantidad: number; precioUnitario: number }[] = [];
    for (let j = 0; j < cantidadItems; j++) {
      let producto = elegir(productosCreados);
      while (usados.has(producto.id)) producto = elegir(productosCreados);
      usados.add(producto.id);
      items.push({
        productoId: producto.id,
        cantidad: entre(1, 6),
        precioUnitario: producto.precio,
      });
    }
    const total = items.reduce((suma, it) => suma + it.cantidad * it.precioUnitario, 0);

    await prisma.pedido.create({
      data: {
        numero: 1001 + i,
        estado,
        fecha,
        total,
        notas: elegir(notasPosibles),
        clienteId: cliente.id,
        items: { create: items },
      },
    });
  }

  console.log("Seed listo: 15 productos, 20 clientes y 60 pedidos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
