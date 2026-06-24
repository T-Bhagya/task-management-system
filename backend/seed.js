const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed dummy data...');

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('Admin@1234', 10),
        role: 'ADMIN',
        must_reset_password: false
      }
    });
  }

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Create 2 Project Managers
  console.log('Creating Project Managers...');
  const pm1 = await prisma.user.upsert({
    where: { email: 'manager1@test.com' },
    update: {},
    create: {
      name: 'Alice Manager',
      email: 'manager1@test.com',
      password_hash: defaultPassword,
      role: 'PROJECT_MANAGER',
      is_active: true,
      must_reset_password: false,
    },
  });

  const pm2 = await prisma.user.upsert({
    where: { email: 'manager2@test.com' },
    update: {},
    create: {
      name: 'Bob Manager',
      email: 'manager2@test.com',
      password_hash: defaultPassword,
      role: 'PROJECT_MANAGER',
      is_active: true,
      must_reset_password: false,
    },
  });

  // Create 5 Collaborators
  console.log('Creating Collaborators...');
  const collabs = [];
  for (let i = 1; i <= 5; i++) {
    const collab = await prisma.user.upsert({
      where: { email: `collab${i}@test.com` },
      update: {},
      create: {
        name: `Collaborator ${i}`,
        email: `collab${i}@test.com`,
        password_hash: defaultPassword,
        role: 'COLLABORATOR',
        is_active: true,
        must_reset_password: false,
      },
    });
    collabs.push(collab);
  }

  // Create 3 Projects
  console.log('Creating Projects...');
  const proj1 = await prisma.project.upsert({
    where: { id: 1 }, // We'll just try to find by some unique criteria, but upsert needs a unique field. Project doesn't have unique name.
    update: {},
    create: {
      name: 'Website Redesign',
      description: 'Overhauling the company website with new branding.',
      created_by: admin.id,
      manager_id: pm1.id,
    },
  }).catch(async () => {
    // Fallback if ID 1 doesn't work for upsert because it doesn't exist
    const existing = await prisma.project.findFirst({ where: { name: 'Website Redesign' } });
    if (existing) return existing;
    return prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Overhauling the company website with new branding.',
        created_by: admin.id,
        manager_id: pm1.id,
      }
    });
  });

  const proj2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Mobile App Launch',
      description: 'Developing the iOS and Android applications.',
      created_by: admin.id,
      manager_id: pm2.id,
    },
  }).catch(async () => {
    const existing = await prisma.project.findFirst({ where: { name: 'Mobile App Launch' } });
    if (existing) return existing;
    return prisma.project.create({
      data: {
        name: 'Mobile App Launch',
        description: 'Developing the iOS and Android applications.',
        created_by: admin.id,
        manager_id: pm2.id,
      }
    });
  });

  const proj3 = await prisma.project.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Marketing Campaign Q3',
      description: 'Planning and executing the Q3 digital marketing strategy.',
      created_by: admin.id,
      manager_id: pm1.id,
    },
  }).catch(async () => {
    const existing = await prisma.project.findFirst({ where: { name: 'Marketing Campaign Q3' } });
    if (existing) return existing;
    return prisma.project.create({
      data: {
        name: 'Marketing Campaign Q3',
        description: 'Planning and executing the Q3 digital marketing strategy.',
        created_by: admin.id,
        manager_id: pm1.id,
      }
    });
  });

  // Assign Collaborators to Projects
  console.log('Assigning Collaborators to Projects...');
  
  // proj1: collabs 1, 2, 3
  for (const collabId of [collabs[0].id, collabs[1].id, collabs[2].id]) {
    const exists = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: proj1.id, user_id: collabId } }
    });
    if (!exists) {
      await prisma.projectMember.create({ data: { project_id: proj1.id, user_id: collabId } });
    }
  }

  // proj2: collabs 3, 4, 5
  for (const collabId of [collabs[2].id, collabs[3].id, collabs[4].id]) {
    const exists = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: proj2.id, user_id: collabId } }
    });
    if (!exists) {
      await prisma.projectMember.create({ data: { project_id: proj2.id, user_id: collabId } });
    }
  }

  // proj3: collabs 1, 5
  for (const collabId of [collabs[0].id, collabs[4].id]) {
    const exists = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: proj3.id, user_id: collabId } }
    });
    if (!exists) {
      await prisma.projectMember.create({ data: { project_id: proj3.id, user_id: collabId } });
    }
  }

  console.log('Dummy data seeded successfully!');
  console.log('--------------------------------------------------');
  console.log('All users created with the password: Password123!');
  console.log('- manager1@test.com (Project Manager)');
  console.log('- manager2@test.com (Project Manager)');
  console.log('- collab1@test.com to collab5@test.com (Collaborators)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
