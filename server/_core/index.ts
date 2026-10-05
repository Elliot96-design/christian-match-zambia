import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { uploadRoot } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/uploads", express.static(path.resolve(uploadRoot)));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // ─── Heartbeat scheduled task handler ──────────────────────────────────────
  app.post("/api/scheduled/premium-expiry-check", async (req, res) => {
    try {
      const { createNotification, getUsersWithExpiringPremium, getUsersWithExpiredPremium, downgradePremium } = await import("../db");
      
      // Check for users with premium expiring in 3 days
      const expiringUsers = await getUsersWithExpiringPremium(3);
      for (const user of expiringUsers) {
        await createNotification({
          userId: user.id,
          type: "premium_reminder",
          title: "Your Premium Expires Soon",
          content: "Your premium membership expires in 3 days. Renew now to keep your benefits.",
        });
      }
      
      // Check for users with expired premium and downgrade them
      const expiredUsers = await getUsersWithExpiredPremium();
      for (const user of expiredUsers) {
        await downgradePremium(user.id);
        await createNotification({
          userId: user.id,
          type: "premium_expired",
          title: "Premium Expired",
          content: "Your premium membership has expired. Upgrade to premium to continue enjoying unlimited chat access.",
        });
      }
      
      res.json({ ok: true, expiringCount: expiringUsers.length, expiredCount: expiredUsers.length });
    } catch (error) {
      console.error("Premium expiry check error:", error);
      res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
