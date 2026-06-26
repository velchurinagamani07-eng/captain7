import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import analyticsRouter from "./routes/analytics.js";
import notificationsRouter from "./routes/notifications.js";
import paymentsRouter from "./routes/payments.js";
import workersRouter from "./routes/workers.js";

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
const localOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176"
];

app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === allowedOrigin || localOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "captain-7-api" });
});

app.use("/api/payments", paymentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/workers", workersRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Captain 7 API listening on port ${port}`);
});