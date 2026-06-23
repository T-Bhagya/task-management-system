const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_CUlVkcR1OJp6@ep-lively-moon-aoltsifv.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
});

async function main() {
    try {
        const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`;
        console.log("TABLES IN DB:", tables);
        const users = await prisma.user.findMany();
        console.log(users);
    } catch(e) {
        console.error(e);
    }
}
main().finally(() => prisma.$disconnect());
