require('dotenv').config();
console.log("DATABASE_URL IS:", process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({
        data: {
            name: 'Test',
            email: 'test@test.com',
            password_hash: 'test',
            role: 'COLLABORATOR',
            is_active: true,
            must_reset_password: false
        }
    });
    console.log("User created:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
