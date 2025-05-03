import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.SERVER_PORT || 8080;

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
