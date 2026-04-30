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
  isPremium: boolean("isPremium").default(false).notNull(),
  premiumSince: timestamp("premiumSince"),
  // Faith & Values
  denomination: varchar("denomination", { length: 128 }),
  faithLevel: mysqlEnum("faithLevel", ["growing", "committed", "deeply_rooted"]),
  bibleVersion: varchar("bibleVersion", { length: 64 }),
  prayerFrequency: mysqlEnum("prayerFrequency", ["daily", "weekly", "occasionally"]),
  // Relationship Preferences
  lookingFor: mysqlEnum("lookingFor", ["marriage", "friendship", "dating", "not_sure"]),
  ageRangeMin: int("ageRangeMin"),
  ageRangeMax: int("ageRangeMax"),
  preferredLocation: varchar("preferredLocation", { length: 128 }),
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

// Private chat messages (1-on-1)
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 128 }).notNull(), // sorted "userId1_userId2"
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Additional profile photos (up to 5 per user)
export const userPhotos = mysqlTable("user_photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoKey: text("photoKey").notNull(),
  isMain: boolean("isMain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserPhoto = typeof userPhotos.$inferSelect;
export type InsertUserPhoto = typeof userPhotos.$inferInsert;

// Community chatroom messages
export const chatroomMessages = mysqlTable("chatroom_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", [
    "general",
    "bible_verse",
    "testimony",
    "prayer_request",
    "counseling",
  ]).default("general").notNull(),
  category: mysqlEnum("category", [
    "general",
    "counseling",
    "testimonies",
    "bible_verse",
    "prayer_requests",
    "prayer_sessions",
  ]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatroomMessage = typeof chatroomMessages.$inferSelect;
export type InsertChatroomMessage = typeof chatroomMessages.$inferInsert;

// Reactions on community chatroom messages
export const chatroomReactions = mysqlTable("chatroom_reactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  reactionType: mysqlEnum("reactionType", ["heart", "pray"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatroomReaction = typeof chatroomReactions.$inferSelect;
export type InsertChatroomReaction = typeof chatroomReactions.$inferInsert;
