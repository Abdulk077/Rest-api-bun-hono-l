import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { stream, streamText, streamSSE } from "hono/streaming";
const app = new Hono();
//const Videos = [];

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
// Read by video id
app.get("/video/:id", (c) => {
  const { id } = c.req.param();
  const video = Videos.find((video) => video.id === id);
  if (!video) {
    return c.json({ error: "Video not found" }, 404);
  }
  return c.json(video);
});
// for update the video details
app.put("/video/:id", async (c) => {
  const { id } = c.req.param();
  const { videoname, cahnnelname, duration } = await c.req.json();
  const videoIndex = Videos.findIndex((video) => video.id === id);
  if (videoIndex === -1) {
    return c.json({ error: "Video not found" }, 404);
  }
  const updatedVideo = {
    id,
    videoname,
    cahnnelname,
    duration,
  };
  Videos[videoIndex] = updatedVideo;
  return c.json(updatedVideo);
});
// for delete the video
app.delete("/video/:id", (c) => {
  const { id } = c.req.param();
  Videos = Videos.filter((video) => video.id !== id);
  return c.json({ message: "Video deleted successfully" });
});
// Delete all videos
app.delete("/videos", (c) => {
  Videos = [];
  return c.json({ message: "All videos deleted successfully" });
});
// streaming a image
app.get("/stream-image", (c) => {
  c.header("Content-Type", "image/jpg");
  return stream(c, async (stream) => {
    // fetcing the image from the url
    const response = await fetch(
      "https://media.gettyimages.com/id/1475043801/photo/choice-variation-concept.jpg?s=612x612&w=0&k=20&c=zZJfHTFo6764SW6uVaLmLWhxb9AoFRFj35bLdo6aql0=",
    );
    // streaming the image data to the client
    await stream.pipe(response.body);
  });
});
export default app;
