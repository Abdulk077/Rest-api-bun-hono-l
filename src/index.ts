import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import hlsRoutes from "./routes/hls";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: "*" }));

app.route("/hls", hlsRoutes);

app.get("/", (c) => c.json({ status: "ok" }));

export default { port: 3000, fetch: app.fetch };
