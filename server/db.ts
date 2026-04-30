import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ChatUnlock,
  InsertChatUnlock,
  InsertMessage,
  InsertUser,
  InsertUserPhoto,
  Message,
  User,
  UserPhoto,
  chatUnlocks,
  messages,
  userPhotos,
  users,
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
