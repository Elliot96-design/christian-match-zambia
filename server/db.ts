import { and, desc, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Announcement,
  AppSetting,
  ChatUnlock,
  InsertAnnouncement,
  InsertChatUnlock,
  InsertLoveStory,
  InsertMessage,
  InsertNotification,
  InsertSupportTicket,
  InsertSwipe,
  InsertUser,
  InsertUserPhoto,
  LoveStory,
  Message,
  Notification,
  SupportTicket,
  Swipe,
  User,
  UserPhoto,
  announcements,
  appSettings,
  chatUnlocks,
  loveStories,
  messages,
  notifications,
  supportTickets,
  swipes,
  userPhotos,
  users,
  emailVerificationTokens,
  passwordResetTokens,
  securityAuditLogs,
  socialAccounts,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "phone", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getSocialAccount(provider: string, providerAccountId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(socialAccounts).where(and(eq(socialAccounts.provider, provider), eq(socialAccounts.providerAccountId, providerAccountId))).limit(1);
  return result[0];
}

export async function createSocialUser(data: { provider: string; providerAccountId: string; email: string; name?: string; photoUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(users).values({
    openId: `social_${data.provider}_${crypto.randomUUID()}`,
    email: data.email,
    name: data.name || null,
    photoUrl: data.photoUrl || null,
    loginMethod: data.provider,
    emailVerified: true,
    lastSignedIn: new Date(),
  });
  const userId = Number((result[0] as { insertId: number }).insertId);
  await db.insert(socialAccounts).values({ userId, provider: data.provider, providerAccountId: data.providerAccountId, email: data.email });
  const user = await getUserById(userId);
  if (!user) throw new Error("Failed to create social user");
  return user;
}

export async function linkSocialAccount(userId: number, provider: string, providerAccountId: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(socialAccounts).values({ userId, provider, providerAccountId, email });
}

export async function createLocalUser(data: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const openId = `local_${crypto.randomUUID()}`;
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name || null,
    loginMethod: "password",
    lastSignedIn: new Date(),
  });
  const insertId = Number((result[0] as { insertId: number }).insertId);
  const user = await getUserById(insertId);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function createEmailVerificationToken(userId: number, tokenHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
}

export async function verifyEmailWithToken(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db.select().from(emailVerificationTokens).where(and(
    eq(emailVerificationTokens.tokenHash, tokenHash),
    isNull(emailVerificationTokens.usedAt),
    gt(emailVerificationTokens.expiresAt, new Date()),
  )).limit(1);
  const token = rows[0];
  if (!token) return false;
  await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(and(eq(emailVerificationTokens.id, token.id), isNull(emailVerificationTokens.usedAt)));
  await db.update(users).set({ emailVerified: true }).where(eq(users.id, token.userId));
  return true;
}

export async function createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
}

export async function resetPasswordWithToken(tokenHash: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db.select().from(passwordResetTokens).where(and(
    eq(passwordResetTokens.tokenHash, tokenHash),
    isNull(passwordResetTokens.usedAt),
    gt(passwordResetTokens.expiresAt, new Date()),
  )).limit(1);
  const token = rows[0];
  if (!token) return false;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.id, token.id), isNull(passwordResetTokens.usedAt)));
  await db.update(users).set({ passwordHash, emailVerified: true, lastSignedIn: new Date() }).where(eq(users.id, token.userId));
  return true;
}

export async function touchUserLogin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function recordSecurityEvent(event: {
  action: string;
  userId?: number;
  email?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(securityAuditLogs).values({
      action: event.action,
      userId: event.userId,
      email: event.email,
      ipAddress: event.ipAddress,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    });
  } catch (error) {
    console.error("[Security] Failed to write audit event:", error);
  }
}

export async function getSecurityAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(securityAuditLogs).orderBy(desc(securityAuditLogs.createdAt)).limit(Math.min(limit, 500));
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  data: {
    name?: string;
    age?: number;
    gender?: "male" | "female";
    location?: string;
    church?: string;
    bio?: string;
    photoUrl?: string;
    photoKey?: string;
    profileComplete?: boolean;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function browseUsers(
  currentUserId: number,
  filters: { gender?: "male" | "female"; location?: string },
  limit = 20,
  offset = 0
): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    ne(users.id, currentUserId),
    eq(users.isBanned, false),
    eq(users.profileComplete, true),
  ];
  if (filters.gender) conditions.push(eq(users.gender, filters.gender));
  if (filters.location) conditions.push(eq(users.location, filters.location));

  return db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function banUser(userId: number, banned: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned: banned }).where(eq(users.id, userId));
}

export async function getDistinctLocations(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ location: users.location })
    .from(users)
    .where(and(eq(users.profileComplete, true), eq(users.isBanned, false)));
  return rows.map((r) => r.location).filter(Boolean) as string[];
}

export async function setUserPremium(userId: number, isPremium: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ isPremium, premiumSince: isPremium ? new Date() : null })
    .where(eq(users.id, userId));
}

export async function hasAnyCompletedUnlock(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: chatUnlocks.id })
    .from(chatUnlocks)
    .where(and(eq(chatUnlocks.payerId, userId), eq(chatUnlocks.status, "completed")))
    .limit(1);
  return result.length > 0;
}

// ─── User Photos ──────────────────────────────────────────────────────────────

export async function getUserPhotos(userId: number): Promise<UserPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userPhotos)
    .where(eq(userPhotos.userId, userId))
    .orderBy(desc(userPhotos.createdAt));
}

export async function addUserPhoto(data: InsertUserPhoto): Promise<UserPhoto> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(userPhotos).values(data);
  const insertId = (result[0] as { insertId: number }).insertId;
  const rows = await db.select().from(userPhotos).where(eq(userPhotos.id, insertId)).limit(1);
  return rows[0];
}

export async function countUserPhotos(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userPhotos)
    .where(eq(userPhotos.userId, userId));
  return Number(result[0]?.count ?? 0);
}

// ─── Chat Unlocks ─────────────────────────────────────────────────────────────

export async function getChatUnlock(
  userId: number,
  targetId: number
): Promise<ChatUnlock | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // Check both directions
  const result = await db
    .select()
    .from(chatUnlocks)
    .where(
      and(
        eq(chatUnlocks.status, "completed"),
        or(
          and(eq(chatUnlocks.payerId, userId), eq(chatUnlocks.targetId, targetId)),
          and(eq(chatUnlocks.payerId, targetId), eq(chatUnlocks.targetId, userId))
        )
      )
    )
    .limit(1);
  return result[0];
}

export async function createChatUnlock(data: InsertChatUnlock): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatUnlocks).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getPendingUnlockById(id: number, payerId: number): Promise<ChatUnlock | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(chatUnlocks)
    .where(and(eq(chatUnlocks.id, id), eq(chatUnlocks.payerId, payerId)))
    .limit(1);
  return result[0];
}

export async function completeChatUnlock(id: number, reference: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatUnlocks)
    .set({ status: "completed", reference })
    .where(eq(chatUnlocks.id, id));
}

export async function getAllPayments(): Promise<(ChatUnlock & { payerName: string | null; targetName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const payer = { id: users.id, name: users.name };
  const rows = await db
    .select({
      id: chatUnlocks.id,
      payerId: chatUnlocks.payerId,
      targetId: chatUnlocks.targetId,
      status: chatUnlocks.status,
      amount: chatUnlocks.amount,
      provider: chatUnlocks.provider,
      reference: chatUnlocks.reference,
      createdAt: chatUnlocks.createdAt,
      payerName: sql<string>`payer.name`,
      targetName: sql<string>`target.name`,
    })
    .from(chatUnlocks)
    .leftJoin(sql`users payer`, sql`payer.id = ${chatUnlocks.payerId}`)
    .leftJoin(sql`users target`, sql`target.id = ${chatUnlocks.targetId}`)
    .orderBy(desc(chatUnlocks.createdAt));
  return rows as (ChatUnlock & { payerName: string | null; targetName: string | null })[];
}

// ─── Unlocked Chats List ─────────────────────────────────────────────────────

export async function getMyUnlockedChats(
  userId: number
): Promise<{ targetId: number; targetName: string | null; targetPhotoUrl: string | null; targetChurch: string | null; targetAge: number | null; unlockedAt: Date }[]> {
  const db = await getDb();
  if (!db) return [];
  // Get all completed unlocks where the current user is the payer
  const rows = await db
    .select({
      targetId: chatUnlocks.targetId,
      targetName: sql<string>`u.name`,
      targetPhotoUrl: sql<string>`u.photoUrl`,
      targetChurch: sql<string>`u.church`,
      targetAge: sql<number>`u.age`,
      unlockedAt: chatUnlocks.createdAt,
    })
    .from(chatUnlocks)
    .leftJoin(sql`users u`, sql`u.id = ${chatUnlocks.targetId}`)
    .where(
      and(
        eq(chatUnlocks.payerId, userId),
        eq(chatUnlocks.status, "completed")
      )
    )
    .orderBy(desc(chatUnlocks.createdAt));
  return rows as { targetId: number; targetName: string | null; targetPhotoUrl: string | null; targetChurch: string | null; targetAge: number | null; unlockedAt: Date }[];
}

// ─── Premium Payments ─────────────────────────────────────────────────────────

export async function createPremiumPayment(data: {
  payerId: number;
  amount: number;
  provider: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // We reuse chatUnlocks table with targetId = 0 to represent a premium subscription payment
  const result = await db.insert(chatUnlocks).values({
    payerId: data.payerId,
    targetId: 0, // sentinel: 0 = premium subscription
    amount: data.amount,
    provider: data.provider as "mtn" | "airtel" | "mock",
    status: "pending",
  });
  return (result[0] as { insertId: number }).insertId;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function buildRoomId(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join("_");
}

export async function getMessages(roomId: string, limit = 50): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function sendMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  const insertId = (result[0] as { insertId: number }).insertId;
  const rows = await db.select().from(messages).where(eq(messages.id, insertId)).limit(1);
  return rows[0];
}

// ─── Chatroom ─────────────────────────────────────────────────────────────────

import {
  ChatroomMessage,
  ChatroomReaction,
  InsertChatroomMessage,
  chatroomMessages,
  chatroomReactions,
} from "../drizzle/schema";

export async function getChatroomMessages(
  category: string | null,
  limit = 40,
  offset = 0
): Promise<(ChatroomMessage & { userName: string | null; userPhotoUrl: string | null; userIsPremium: boolean })[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (category && category !== "general") {
    conditions.push(eq(chatroomMessages.category, category as ChatroomMessage["category"]));
  }

  const rows = await db
    .select({
      id: chatroomMessages.id,
      userId: chatroomMessages.userId,
      content: chatroomMessages.content,
      messageType: chatroomMessages.messageType,
      category: chatroomMessages.category,
      createdAt: chatroomMessages.createdAt,
      userName: sql<string>`u.name`,
      userPhotoUrl: sql<string>`u.photoUrl`,
      userIsPremium: sql<boolean>`u.isPremium`,
    })
    .from(chatroomMessages)
    .leftJoin(sql`users u`, sql`u.id = ${chatroomMessages.userId}`)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(chatroomMessages.createdAt))
    .limit(limit)
    .offset(offset);

  return rows as (ChatroomMessage & { userName: string | null; userPhotoUrl: string | null; userIsPremium: boolean })[];
}

export async function postChatroomMessage(data: InsertChatroomMessage): Promise<ChatroomMessage> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatroomMessages).values(data);
  const insertId = (result[0] as { insertId: number }).insertId;
  const rows = await db.select().from(chatroomMessages).where(eq(chatroomMessages.id, insertId)).limit(1);
  return rows[0];
}

export async function getMessageReactions(
  messageIds: number[]
): Promise<ChatroomReaction[]> {
  if (messageIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatroomReactions)
    .where(sql`${chatroomReactions.messageId} IN (${sql.join(messageIds.map((id) => sql`${id}`), sql`, `)})`);
}

export async function toggleChatroomReaction(
  messageId: number,
  userId: number,
  reactionType: "heart" | "pray"
): Promise<{ added: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(chatroomReactions)
    .where(
      and(
        eq(chatroomReactions.messageId, messageId),
        eq(chatroomReactions.userId, userId),
        eq(chatroomReactions.reactionType, reactionType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(chatroomReactions)
      .where(eq(chatroomReactions.id, existing[0].id));
    return { added: false };
  } else {
    await db.insert(chatroomReactions).values({ messageId, userId, reactionType });
    return { added: true };
  }
}

export async function getChatroomOnlineCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Count users active in the last 10 minutes
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.isBanned, false), sql`${users.lastSignedIn} > ${cutoff}`));
  return Number(result[0]?.count ?? 0);
}

// ─── Swipe / Discover ───────────────────────────────────────────────────────

export async function browseSwipeList(
  currentUserId: number,
  filter: "all" | "online" | "new" | "nearby",
  currentUserLocation: string | null,
  limit = 20,
  offset = 0
): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    ne(users.id, currentUserId),
    eq(users.isBanned, false),
    eq(users.profileComplete, true),
  ];

  if (filter === "online") {
    conditions.push(eq(users.isOnline, true));
  } else if (filter === "new") {
    // New members: joined in the last 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    conditions.push(sql`${users.createdAt} >= ${cutoff}`);
  } else if (filter === "nearby" && currentUserLocation) {
    conditions.push(eq(users.location, currentUserLocation));
  }

  return db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.isPremium), desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function setUserOnline(userId: number, isOnline: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isOnline, lastSeen: new Date() }).where(eq(users.id, userId));
}

export async function updateUserOccupation(userId: number, occupation: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ occupation }).where(eq(users.id, userId));
}

// ─── Faith & Relationship Profile ────────────────────────────────────────────

export async function updateFaithProfile(
  userId: number,
  data: {
    denomination?: string;
    faithLevel?: "growing" | "committed" | "deeply_rooted";
    bibleVersion?: string;
    prayerFrequency?: "daily" | "weekly" | "occasionally";
    church?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateRelationshipPrefs(
  userId: number,
  data: {
    lookingFor?: "marriage" | "friendship" | "dating" | "not_sure";
    ageRangeMin?: number;
    ageRangeMax?: number;
    preferredLocation?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getFaithProfile(userId: number): Promise<{
  denomination: string | null;
  faithLevel: string | null;
  bibleVersion: string | null;
  prayerFrequency: string | null;
  church: string | null;
  lookingFor: string | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  preferredLocation: string | null;
} | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      denomination: users.denomination,
      faithLevel: users.faithLevel,
      bibleVersion: users.bibleVersion,
      prayerFrequency: users.prayerFrequency,
      church: users.church,
      lookingFor: users.lookingFor,
      ageRangeMin: users.ageRangeMin,
      ageRangeMax: users.ageRangeMax,
      preferredLocation: users.preferredLocation,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}

// ─── Love Stories ─────────────────────────────────────────────────────────────;

export async function getLoveStories(limit = 10): Promise<LoveStory[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(loveStories)
    .orderBy(desc(loveStories.createdAt))
    .limit(limit);
}

export async function createLoveStory(data: InsertLoveStory): Promise<LoveStory> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(loveStories).values(data);
  const insertId = (result[0] as { insertId: number }).insertId;
  const rows = await db.select().from(loveStories).where(eq(loveStories.id, insertId)).limit(1);
  return rows[0];
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getAnnouncements(limit = 10): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(announcements).values(data);
  const insertId = (result[0] as { insertId: number }).insertId;
  const rows = await db.select().from(announcements).where(eq(announcements.id, insertId)).limit(1);
  return rows[0];
}

// ─── Suggested Profiles ───────────────────────────────────────────────────────

export async function getSuggestedProfiles(currentUserId: number, limit = 8): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(
      and(
        ne(users.id, currentUserId),
        eq(users.isBanned, false),
        eq(users.profileComplete, true),
      )
    )
    .orderBy(desc(users.isPremium), desc(users.isOnline), desc(users.createdAt))
    .limit(limit);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: "like" | "announcement" | "premium_reminder";
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
  meta?: Record<string, unknown>;
}

export async function getNotificationsForUser(userId: number): Promise<NotificationItem[]> {
  const db = await getDb();
  const items: NotificationItem[] = [];

  if (db) {
    // Likes: people who unlocked chat with this user (they "liked" them)
    const likes = await db
      .select({ id: chatUnlocks.id, payerId: chatUnlocks.payerId, createdAt: chatUnlocks.createdAt })
      .from(chatUnlocks)
      .where(and(eq(chatUnlocks.targetId, userId), eq(chatUnlocks.status, "completed")))
      .orderBy(desc(chatUnlocks.createdAt))
      .limit(10);

    for (const like of likes) {
      items.push({
        id: `like-${like.id}`,
        type: "like",
        title: "Someone unlocked your chat",
        description: "A member paid K20 to start a conversation with you. Check your messages!",
        createdAt: like.createdAt,
        read: false,
        meta: { payerId: like.payerId },
      });
    }

    // Announcements
    const ann = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(5);

    for (const a of ann) {
      items.push({
        id: `ann-${a.id}`,
        type: "announcement",
        title: a.title,
        description: a.content,
        createdAt: a.createdAt,
        read: false,
      });
    }
  }

   // Sort by date descending
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}

// ─── Admin Portal Auth ────────────────────────────────────────────────────────
export async function getAdminByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.adminUsername, username), eq(users.role, "admin")))
    .limit(1);
  return rows[0] ?? null;
}

export async function setAdminCredentials(
  userId: number,
  username: string,
  passwordHash: string,
  pinHash: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ adminUsername: username, adminPasswordHash: passwordHash, adminPin: pinHash })
    .where(eq(users.id, userId));
}

// ─── Admin Panel Helpers ──────────────────────────────────────────────────────

export async function getAdminStats(): Promise<{
  totalUsers: number;
  premiumUsers: number;
  totalRevenue: number;
  chatUnlockRevenue: number;
  premiumRevenue: number;
  totalPayments: number;
  openTickets: number;
  bannedUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
}> {
  const db = await getDb();
  if (!db) return { totalUsers: 0, premiumUsers: 0, totalRevenue: 0, chatUnlockRevenue: 0, premiumRevenue: 0, totalPayments: 0, openTickets: 0, bannedUsers: 0, verifiedUsers: 0, newUsersToday: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [allUsers, allPayments, allTickets] = await Promise.all([
    db.select().from(users),
    db.select().from(chatUnlocks).where(eq(chatUnlocks.status, "completed")),
    db.select().from(supportTickets),
  ]);
  const premiumUsers = allUsers.filter(u => u.isPremium).length;
  const bannedUsers = allUsers.filter(u => u.isBanned).length;
  const verifiedUsers = allUsers.filter(u => u.isVerified).length;
  const newUsersToday = allUsers.filter(u => u.createdAt >= today).length;
  const chatUnlockRevenue = allPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const premiumRevenue = premiumUsers * 50; // K50 first month estimate
  const openTickets = allTickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  return {
    totalUsers: allUsers.length,
    premiumUsers,
    totalRevenue: chatUnlockRevenue + premiumRevenue,
    chatUnlockRevenue,
    premiumRevenue,
    totalPayments: allPayments.length,
    openTickets,
    bannedUsers,
    verifiedUsers,
    newUsersToday,
  };
}

export async function getAllSupportTickets(): Promise<(SupportTicket & { userName: string | null; userEmail: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: supportTickets.id,
      userId: supportTickets.userId,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      adminReply: supportTickets.adminReply,
      adminId: supportTickets.adminId,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt));
  return rows as (SupportTicket & { userName: string | null; userEmail: string | null })[];
}

export async function createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(supportTickets).values(data).$returningId();
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, result.id)).limit(1);
  return rows[0];
}

export async function resolveTicket(ticketId: number, adminId: number, reply: string, status: "in_progress" | "resolved" | "closed"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set({ adminReply: reply, adminId, status }).where(eq(supportTickets.id, ticketId));
}

export async function getAppSettings(): Promise<AppSetting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appSettings).orderBy(appSettings.settingKey);
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(appSettings).where(eq(appSettings.settingKey, key)).limit(1);
  return rows[0]?.settingValue ?? null;
}

export async function upsertAppSetting(key: string, value: string, updatedBy?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(appSettings).where(eq(appSettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appSettings).set({ settingValue: value, updatedBy: updatedBy ?? null }).where(eq(appSettings.settingKey, key));
  } else {
    await db.insert(appSettings).values({ settingKey: key, settingValue: value, updatedBy: updatedBy ?? null });
  }
}

export async function verifyUser(userId: number, verified: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isVerified: verified }).where(eq(users.id, userId));
}

export async function getAllAdminAccounts(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "admin")).orderBy(desc(users.createdAt));
}

export async function updateAdminPanel(userId: number, panel: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ adminPanel: panel as User["adminPanel"] }).where(eq(users.id, userId));
}

export async function updateAdminCredentialsFull(
  userId: number,
  updates: { adminUsername?: string; adminPasswordHash?: string; adminPin?: string; adminPanel?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const set: Partial<User> = {};
  if (updates.adminUsername !== undefined) set.adminUsername = updates.adminUsername;
  if (updates.adminPasswordHash !== undefined) set.adminPasswordHash = updates.adminPasswordHash;
  if (updates.adminPin !== undefined) set.adminPin = updates.adminPin;
  if (updates.adminPanel !== undefined) set.adminPanel = updates.adminPanel as User["adminPanel"];
  if (Object.keys(set).length > 0) {
    await db.update(users).set(set).where(eq(users.id, userId));
  }
}

export async function getAllLoveStories(): Promise<LoveStory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loveStories).orderBy(desc(loveStories.createdAt));
}

export async function deleteLoveStory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(loveStories).where(eq(loveStories.id, id));
}

export async function updateLoveStory(id: number, data: Partial<InsertLoveStory>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(loveStories).set(data).where(eq(loveStories.id, id));
}

export async function getAllAnnouncements(): Promise<(typeof announcements.$inferSelect & { adminName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      adminId: announcements.adminId,
      createdAt: announcements.createdAt,
      adminName: users.name,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.adminId, users.id))
    .orderBy(desc(announcements.createdAt));
  return rows as (typeof announcements.$inferSelect & { adminName: string | null })[];
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function getChatroomMessagesAdmin(limit = 100): Promise<(typeof import("../drizzle/schema").chatroomMessages.$inferSelect & { userName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const { chatroomMessages } = await import("../drizzle/schema");
  const rows = await db
    .select({
      id: chatroomMessages.id,
      userId: chatroomMessages.userId,
      content: chatroomMessages.content,
      messageType: chatroomMessages.messageType,
      category: chatroomMessages.category,
      createdAt: chatroomMessages.createdAt,
      userName: users.name,
    })
    .from(chatroomMessages)
    .leftJoin(users, eq(chatroomMessages.userId, users.id))
    .orderBy(desc(chatroomMessages.createdAt))
    .limit(limit);
  return rows as (typeof chatroomMessages.$inferSelect & { userName: string | null })[];
}

export async function deleteChatroomMessage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { chatroomMessages } = await import("../drizzle/schema");
  await db.delete(chatroomMessages).where(eq(chatroomMessages.id, id));
}

export async function getUsersWithDetails(): Promise<(User & { photoCount: number; messageCount: number })[]> {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const photoCounts = await db
    .select({ userId: userPhotos.userId, count: sql<number>`count(*)` })
    .from(userPhotos)
    .groupBy(userPhotos.userId);
  const photoMap = new Map(photoCounts.map(p => [p.userId, Number(p.count)]));
  return allUsers.map(u => ({
    ...u,
    photoCount: photoMap.get(u.id) ?? 0,
    messageCount: 0,
  }));
}

export async function getPremiumPaymentsList(): Promise<{
  id: number; userId: number; userName: string | null; amount: number; provider: string; status: string; createdAt: Date;
}[]> {
  const db = await getDb();
  if (!db) return [];
  // Use chatUnlocks as the payment source (both K20 unlocks and premium)
  const rows = await db
    .select({
      id: chatUnlocks.id,
      userId: chatUnlocks.payerId,
      userName: users.name,
      amount: chatUnlocks.amount,
      provider: chatUnlocks.provider,
      status: chatUnlocks.status,
      createdAt: chatUnlocks.createdAt,
    })
    .from(chatUnlocks)
    .leftJoin(users, eq(chatUnlocks.payerId, users.id))
    .orderBy(desc(chatUnlocks.createdAt));
  return rows as { id: number; userId: number; userName: string | null; amount: number; provider: string; status: string; createdAt: Date }[];
}

// ── Admin override helpers ────────────────────────────────────────────────────

export async function updateAnnouncementById(
  id: number,
  updates: { title?: string; content?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(announcements).set(updates).where(eq(announcements.id, id));
}

export async function forceCancelUserPremium(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isPremium: false }).where(eq(users.id, userId));
}

export async function clearAllAnnouncementsDb() {
  const db = await getDb();
  if (!db) return;
  await db.delete(announcements);
}

// ── PIN-only login helper ─────────────────────────────────────────────────────
/** Returns all admin accounts so the caller can bcrypt-compare the PIN against each. */
export async function getAllAdminHashedPins(): Promise<
  { id: number; adminPin: string | null; adminPanel: string | null; openId: string; name: string | null; adminUsername: string | null }[]
> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: users.id,
      adminPin: users.adminPin,
      adminPanel: users.adminPanel,
      openId: users.openId,
      name: users.name,
      adminUsername: users.adminUsername,
    })
    .from(users)
    .where(eq(users.role, "admin"));
  return rows;
}

// ── Unread message count ──────────────────────────────────────────────────────
/**
 * Returns the number of conversations where the most recent message was sent
 * by the OTHER person (i.e., the current user has not replied yet).
 * Used for the Messages badge in the bottom nav.
 */
export async function getUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Get all unlocked chats for this user
  const unlocks = await db
    .select({ payerId: chatUnlocks.payerId, targetId: chatUnlocks.targetId })
    .from(chatUnlocks)
    .where(
      and(
        eq(chatUnlocks.status, "completed"),
        or(eq(chatUnlocks.payerId, userId), eq(chatUnlocks.targetId, userId))
      )
    );
  if (unlocks.length === 0) return 0;
  let unreadCount = 0;
  for (const unlock of unlocks) {
    const otherId = unlock.payerId === userId ? unlock.targetId : unlock.payerId;
    const roomId = userId < otherId ? `${userId}_${otherId}` : `${otherId}_${userId}`;
    // Get the latest message in this room
    const [latest] = await db
      .select({ senderId: messages.senderId })
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    // If the latest message was sent by the other person, it's "unread"
    if (latest && latest.senderId !== userId) {
      unreadCount++;
    }
  }
  return unreadCount;
}

// ── Notification count (real, non-premium) ────────────────────────────────────
/**
 * Returns the count of real notifications (likes + announcements) for the user.
 * Does NOT include the static premium_reminder.
 */
export async function getRealNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [likeCount, annCount] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chatUnlocks)
      .where(and(eq(chatUnlocks.targetId, userId), eq(chatUnlocks.status, "completed"))),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(announcements),
  ]);
  return Number(likeCount[0]?.count ?? 0) + Number(annCount[0]?.count ?? 0);
}


/**
 * Get all potential conversation partners with their lock state
 * Returns: unlocked chats, locked chats (K20 unlock), and premium-only chats
 */
export async function getAllConversationPartners(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users except self
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      age: users.age,
      photoUrl: users.photoUrl,
      isPremium: users.isPremium,
      isOnline: users.isOnline,
    })
    .from(users)
    .where(ne(users.id, userId));

  // Get unlocked chats for this user
  const unlockedIds = await db
    .select({ targetId: chatUnlocks.targetId })
    .from(chatUnlocks)
    .where(and(eq(chatUnlocks.payerId, userId), eq(chatUnlocks.status, "completed")));

  const unlockedSet = new Set(unlockedIds.map(u => u.targetId));

  return allUsers.map(u => ({
    ...u,
    lockState: unlockedSet.has(u.id) 
      ? "unlocked" 
      : u.isPremium 
        ? "premium" 
        : "locked",
  }));
}

/**
 * Get action counts for the current user
 */
export async function getActionCounts(userId: number) {
  const db = await getDb();
  if (!db) return { likes: 0, requests: 0, views: 0 };
  
  // Count new likes (swipes with action = "like")
  const likesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(swipes)
    .where(and(eq(swipes.targetId, userId), eq(swipes.action, "like")));
  const likesCount = likesResult[0]?.count ?? 0;

  // Count chat requests (locked conversations)
  const requestsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatUnlocks)
    .where(and(eq(chatUnlocks.targetId, userId), eq(chatUnlocks.status, "pending")));
  const requestsCount = requestsResult[0]?.count ?? 0;

  // Count profile views (future feature - for now return 0)
  const viewsCount = 0;

  return { likes: likesCount, requests: requestsCount, views: viewsCount };
}

/**
 * Get Chatroom info: online count and sample member avatars
 */
export async function getChatroomInfo() {
  const db = await getDb();
  if (!db) return { onlineCount: 0, members: [] };
  
  const onlineResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isOnline, true));
  const onlineCount = onlineResult[0]?.count ?? 0;

  // Get sample of online members for avatars
  const members = await db
    .select({ id: users.id, name: users.name, photoUrl: users.photoUrl })
    .from(users)
    .where(eq(users.isOnline, true))
    .limit(5);

  return { onlineCount, members };
}

/**
 * Record a swipe action (like, dislike, skip)
 */
export async function recordSwipe(userId: number, targetId: number, action: "like" | "dislike" | "skip") {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(swipes).values({ userId, targetId, action });
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Create a new notification for a user
 */
export async function createNotification(data: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(notifications).values(data);
  
  // Fetch the most recently created notification for this user
  const [created] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, data.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  
  return created ?? null;
}

/**
 * Get all unread notifications for a user
 */
export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return Number(result[0]?.count ?? 0);
}

/**
 * Mark all messages in a room as read for a specific recipient
 */
export async function markMessagesAsRead(roomId: string, recipientId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.roomId, roomId), ne(messages.senderId, recipientId)));
}

/**
 * Get unread message count for a specific conversation
 */
export async function getUnreadCountForRoom(roomId: string, recipientId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(messages)
    .where(and(eq(messages.roomId, roomId), ne(messages.senderId, recipientId), sql`${messages.readAt} IS NULL`));
  
  return Number(result[0]?.count ?? 0);
}

/**
 * Set premium expiry date for a user (30 days from now)
 */
export async function setPremiumExpiry(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  await db
    .update(users)
    .set({ premiumExpiresAt: expiresAt })
    .where(eq(users.id, userId));
}

/**
 * Get users with premium expiring in the next N days
 */
export async function getUsersWithExpiringPremium(daysUntilExpiry: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);
  
  return await db
    .select()
    .from(users)
    .where(and(
      eq(users.isPremium, true),
      sql`${users.premiumExpiresAt} IS NOT NULL`,
      sql`${users.premiumExpiresAt} > ${now}`,
      sql`${users.premiumExpiresAt} <= ${expiryThreshold}`
    ));
}

/**
 * Get users with expired premium
 */
export async function getUsersWithExpiredPremium(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db
    .select()
    .from(users)
    .where(and(
      eq(users.isPremium, true),
      sql`${users.premiumExpiresAt} IS NOT NULL`,
      sql`${users.premiumExpiresAt} <= ${now}`
    ));
}

/**
 * Downgrade a user's premium status
 */
export async function downgradePremium(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(users)
    .set({ isPremium: false, premiumExpiresAt: null })
    .where(eq(users.id, userId));
}
