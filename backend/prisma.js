// prisma.js
import { fileURLToPath } from 'url';
import path from 'path';

// Define o __dirname (necessário em módulos ES)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PrismaClient } from '@prisma/client';

// Configura o Prisma Client
const prisma = new PrismaClient({
  // Tenta resolver a URL de conexão explicitamente
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // O restante do código pode ser adicionado se necessário
});

export default prisma;