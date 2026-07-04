# Imagen para deploy en Dokploy (o cualquier host de contenedores).
# El arranque corre migraciones y, si la base está vacía, el seed
# (npm run start:prod), así que la imagen conserva las dev deps que eso
# necesita en runtime: prisma CLI y tsx.
FROM node:22-slim

# Prisma necesita openssl para sus engines
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
# --include=dev asegura prisma y tsx aunque NODE_ENV venga en production.
# postinstall corre prisma generate.
RUN npm ci --include=dev

COPY . .
# DATABASE_URL descartable: el build no consulta la base (las páginas del
# panel son force-dynamic), pero Prisma exige que la variable exista.
RUN DATABASE_URL="file:/tmp/build.db" npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Acá se monta el volumen con la base SQLite (DATABASE_URL=file:/app/data/vendra.db)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
