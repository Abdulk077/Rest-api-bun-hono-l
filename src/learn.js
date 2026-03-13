import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { stream, streamText, streamSSE } from "hono/streaming";
const app = new Hono();
const Videos = [];

app.get("/", (c) => {
  return c.text("Hello, World!");
});

app.get("/uuid", (c) => {
  const uuid = uuidv4();
  return c.text(`Generated UUID: ${uuid}`);
});
app.post("/video", async (c) => {
  const { videoname, cahnnelname, duration } = await c.req.json();
  const videoId = uuidv4();
  const newVideo = {
    id: videoId,
    videoname,
    cahnnelname,
    duration,
  };
  Videos.push(newVideo);
  return c.json(newVideo);
});
// Reading data using streem
app.get("/videos", (c) => {
  return streamText(c, async (stream) => {
    for (const video of Videos) {
      await stream.writeln(JSON.stringify(video) + "\n");
    }
    await stream.end();
  });
});
// Read
export default app;
