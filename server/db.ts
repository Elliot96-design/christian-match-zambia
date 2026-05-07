import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Announcement,
  AppSetting,
  ChatUnlock,
  InsertAnnouncement,
  InsertChatUnlock,
  InsertLoveStory,
  InsertMessage,
  InsertSupportTicket,
  InsertUser,
  InsertUserPhoto,
  LoveStory,
  Message,
  SupportTicket,
  User,
  UserPhoto,
  announcements,
  appSettings,
  chatUnlocks,
  loveStories,
  messages,
  supportTickets,
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

  // Premium reminder (static, always shown for non-premium users)
  items.push({
    id: "premium-reminder",
    type: "premium_reminder",
    title: "Upgrade to Premium",
    description: "Chat with all members, see who liked you, and get unlimited matches for K50 first month.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
  });

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
