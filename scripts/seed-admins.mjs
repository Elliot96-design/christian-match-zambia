/**
 * Seed script: creates 7 admin accounts in the database.
 * Run with: node scripts/seed-admins.mjs
 */
import { createConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const admins = [
  {
    name: "Finance Admin",
    adminUsername: "finance",
    password: "finance@2026",
    pin: "1234",
    adminPanel: "finance",
    openId: "admin-finance-001",
    email: "finance@faithfulhearts.app",
  },
  {
    name: "Support Admin",
    adminUsername: "support",
    password: "support@2026",
    pin: "2345",
    adminPanel: "support",
    openId: "admin-support-001",
    email: "support@faithfulhearts.app",
  },
  {
    name: "Systems Admin",
    adminUsername: "systems",
    password: "systems@2026",
    pin: "3456",
    adminPanel: "systems",
    openId: "admin-systems-001",
    email: "systems@faithfulhearts.app",
  },
  {
    name: "User Management Admin",
    adminUsername: "usermgmt",
    password: "usermgmt@2026",
    pin: "4567",
    adminPanel: "users",
    openId: "admin-users-001",
    email: "usermgmt@faithfulhearts.app",
  },
  {
    name: "Super Admin",
    adminUsername: "superadmin",
    password: "superadmin@2026",
    pin: "0000",
    adminPanel: "super",
    openId: "admin-super-001",
    email: "superadmin@faithfulhearts.app",
  },
  {
    name: "Announcement Admin",
    adminUsername: "announcements",
    password: "announce@2026",
    pin: "5678",
    adminPanel: "announcements",
    openId: "admin-announce-001",
    email: "announcements@faithfulhearts.app",
  },
  {
    name: "Roles Admin",
    adminUsername: "roles",
    password: "roles@2026",
    pin: "6789",
    adminPanel: "roles",
    openId: "admin-roles-001",
    email: "roles@faithfulhearts.app",
  },
];

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("Connected to database.");

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    const pinHash = await bcrypt.hash(admin.pin, 10);

    // Check if admin already exists
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE adminUsername = ? LIMIT 1",
      [admin.adminUsername]
    );

    if (existing.length > 0) {
      // Update existing
      await conn.execute(
        `UPDATE users SET
          adminPasswordHash = ?,
          adminPin = ?,
          adminPanel = ?,
          role = 'admin',
          name = ?
        WHERE adminUsername = ?`,
        [passwordHash, pinHash, admin.adminPanel, admin.name, admin.adminUsername]
      );
      console.log(`✓ Updated admin: ${admin.adminUsername} (${admin.adminPanel})`);
    } else {
      // Insert new admin user
      await conn.execute(
        `INSERT INTO users (
          openId, name, email, role,
          adminUsername, adminPasswordHash, adminPin, adminPanel,
          profileComplete, isPremium, isBanned, isVerified, isOnline,
          lastSeen, createdAt, updatedAt, lastSignedIn
        ) VALUES (
          ?, ?, ?, 'admin',
          ?, ?, ?, ?,
          0, 0, 0, 1, 0,
          NOW(), NOW(), NOW(), NOW()
        )`,
        [
          admin.openId,
          admin.name,
          admin.email,
          admin.adminUsername,
          passwordHash,
          pinHash,
          admin.adminPanel,
        ]
      );
      console.log(`✓ Created admin: ${admin.adminUsername} (${admin.adminPanel})`);
    }
  }

  await conn.end();
  console.log("\n✅ All 7 admin accounts seeded successfully!\n");
  console.log("Admin Credentials:");
  console.log("─────────────────────────────────────────────────────");
  admins.forEach(a => {
    console.log(`Panel: ${a.adminPanel.padEnd(15)} | Username: ${a.adminUsername.padEnd(15)} | Password: ${a.password.padEnd(18)} | PIN: ${a.pin}`);
  });
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
