const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  // Hash the password (never store plain-text passwords!)
  const hash = await bcrypt.hash('Admin@1234', 10)

  // Create the admin user
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      password_hash: hash,
      role: 'ADMIN',
      is_active: true,
      must_reset_password: false
    }
  })
  console.log('✅ Admin user created successfully!')
  console.log('Email: admin@test.com')
  console.log('Password: Admin@1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })