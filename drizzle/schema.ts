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
  passwordHash: text("passwordHash"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
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
  premiumExpiresAt: timestamp("premiumExpiresAt"),
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
  // Online status & discovery
  isOnline: boolean("isOnline").default(false).notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  occupation: varchar("occupation", { length: 128 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  // Admin portal credentials (only set for admin users)
  adminUsername: varchar("adminUsername", { length: 64 }),
  adminPasswordHash: text("adminPasswordHash"),
  adminPin: varchar("adminPin", { length: 64 }), // bcrypt hash of 4-digit PIN
  adminPanel: mysqlEnum("adminPanel", ["finance", "support", "systems", "users", "announcements", "roles", "super"]).default("users"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Tracks which user pairs have unlocked chat (payment confirmed)
export const chatUnlocks = mysqlTable("chat_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  payerId: int("payerId").notNull(),
  targetId: int("targetId").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  amount: int("amount").default(20).notNull(), // K20
  provider: mysqlEnum("provider", ["mtn", "airtel", "mock"]).default("mock").notNull(),
  reference: varchar("reference", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatUnlock = typeof chatUnlocks.$inferSelect;
export type InsertChatUnlock = typeof chatUnlocks.$inferInsert;

// Private chat messages (1-on-1)
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 128 }).notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("readAt"),
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

// Love stories (admin-created success stories)
export const loveStories = mysqlTable("love_stories", {
  id: int("id").autoincrement().primaryKey(),
  coupleName: varchar("coupleName", { length: 256 }).notNull(),
  location: varchar("location", { length: 256 }).notNull(),
  quoteTitle: text("quoteTitle").notNull(),
  story: text("story").notNull(),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoveStory = typeof loveStories.$inferSelect;
export type InsertLoveStory = typeof loveStories.$inferInsert;

// Admin announcements / updates
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  adminId: int("adminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// Support tickets from users
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  adminReply: text("adminReply"),
  adminId: int("adminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// App-wide settings (key-value store for admin-editable content)
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

// Swipes tracking (likes, dislikes, skips on profile cards)
export const swipes = mysqlTable("swipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetId: int("targetId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 20 }).notNull(), // "like", "dislike", "skip"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = typeof swipes.$inferInsert;

// Notifications (system notifications for likes, messages, premium reminders)
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["like", "message", "chat_request", "premium_reminder", "premium_expired", "view"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content"),
  relatedUserId: int("relatedUserId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
