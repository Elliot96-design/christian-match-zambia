import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Profile fields
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female"]),
  location: varchar("location", { length: 128 }),
  church: varchar("church", { length: 256 }),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  profileComplete: boolean("profileComplete").default(false).notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tracks which user pairs have unlocked chat (payment confirmed)
export const chatUnlocks = mysqlTable("chat_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  payerId: int("payerId").notNull(),
  targetId: int("targetId").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  amount: int("amount").default(10).notNull(), // K10
  provider: mysqlEnum("provider", ["mtn", "airtel", "mock"]).default("mock").notNull(),
  reference: varchar("reference", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatUnlock = typeof chatUnlocks.$inferSelect;
export type InsertChatUnlock = typeof chatUnlocks.$inferInsert;

// Chat messages
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 128 }).notNull(), // sorted "userId1_userId2"
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
