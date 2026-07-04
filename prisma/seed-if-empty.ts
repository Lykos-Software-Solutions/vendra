import { PrismaClient } from "@prisma/client";

// Corre el seed solo si la base está vacía. Pensado para el arranque en
// producción: el seed completo (seed.ts) borra todo antes de cargar, así que
// no hay que ejecutarlo en cada reinicio del contenedor.
const prisma = new PrismaClient();

async function main() {
  const clientes = await prisma.cliente.count();
  if (clientes > 0) {
    console.log(`Base con datos (${clientes} clientes): seed omitido.`);
    return;
  }
  console.log("Base vacía: ejecutando seed…");
  await prisma.$disconnect();
  // seed.ts corre main() al importarse
  await import("./seed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
