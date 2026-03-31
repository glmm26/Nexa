require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const profileRoutes = require("./routes/profileRoutes");
const productRoutes = require("./routes/productRoutes");
const { initializeDatabase } = require("./database/database");
const { respondWithError } = require("./utils/respondWithError");

const SQLiteStore = SQLiteStoreFactory(session);

function createApp() {
  const app = express();
  const distDir = path.join(__dirname, "dist");

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      store: new SQLiteStore({
        db: "sessions.db",
        dir: path.join(__dirname, "database"),
      }),
      name: "nexa_session",
      secret: process.env.SESSION_SECRET || "nexa-style-local-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/profile", profileRoutes);
  app.use(express.static(distDir, { index: false }));

  app.use((error, req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return respondWithError(res, error);
    }

    console.error(error);
    return res.status(error.statusCode || 500).sendFile(path.join(distDir, "index.html"));
  });

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({
        message: "Rota de API nao encontrada.",
      });
    }

    return res.status(200).sendFile(path.join(distDir, "index.html"));
  });

  return app;
}

async function startServer(port = process.env.PORT || 3000) {
  await initializeDatabase();
  const app = createApp();

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Nexa Style rodando em http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  });
}

module.exports = {
  createApp,
  startServer,
};
