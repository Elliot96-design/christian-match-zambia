export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "development-only-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
