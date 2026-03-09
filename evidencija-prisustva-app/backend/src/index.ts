import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import subjectsRoutes from "./routes/subjects.js";

import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import activitiesRoutes from "./routes/activities.js";
import adminRoutes from "./routes/admin.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();

app.use(helmet()); // sigurnosni HTTP headeri

app.use(xss()); // XSS zaštita

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Previše zahteva sa ove IP adrese. Pokušajte kasnije."
});

app.use(limiter);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/me", meRoutes);
app.use("/auth", authRoutes);
app.use("/activities", activitiesRoutes);
app.use("/subjects", subjectsRoutes);
app.use("/admin", adminRoutes);


app.get("/", (req, res) => {
  res.json({ message: "Backend radi 🚀" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});


