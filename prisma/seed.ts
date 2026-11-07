import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "maskarebet";
  const email = "maskarebet@gmail.com";
  const password = "Yunitara@88";
  const nama = "Super Admin";
  const no_hp = "081000000001";

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true, role: true },
  });

  if (existing) {
    console.log(`⚠️  User '${username}' sudah ada (id: ${existing.id}, role: ${existing.role}), skip.`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        nama,
        username,
        email,
        no_hp,
        password: hashedPassword,
        role: "superadmin",
        status: "active",
        email_verified: true,
      },
    });

    console.log("✅ Superadmin berhasil dibuat:");
    console.log(`   ID       : ${user.id}`);
    console.log(`   Username : ${username}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
    console.log(`   Role     : superadmin`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

