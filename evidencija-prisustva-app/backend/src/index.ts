import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js"; 

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/me", meRoutes);

app.use("/auth", authRoutes); 

app.get("/", (req, res) => {
  res.json({ message: "Backend radi 🚀" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});

