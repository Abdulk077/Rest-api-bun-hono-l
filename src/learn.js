import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { stream } from "hono/streaming";
import { join } from "node:path";
import {logger} from "hono/logger";
const app = new Hono();
//const Videos = [];
// using logger middleware
app.use(logger());
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
// streaming an image using another method this one is best for the text streaming
app.get("/streams-image", async (c) => {
  const response = await fetch("https://media.gettyimages.com/id/1475043801/photo/choice-variation-concept.jpg?s=612x612&w=0&k=20&c=zZJfHTFo6764SW6uVaLmLWhxb9AoFRFj35bLdo6aql0=");
  
  if (!response.body) return c.text("No body", 500);

  // We pass along the original content type
  c.header("Content-Type", response.headers.get("Content-Type") || "image/jpeg");

  return stream(c, async (stream) => {
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      // 'value' is the current chunk (a Uint8Array)
      // You can see the size here!
      console.log(`Chunk Received/Sent: ${value.length} bytes`);
      c.header("chunk-size", value.length);
      await stream.write(value);
    }
  });
});

// video streaming using stream pipe from local device
const videoPath = join(import.meta.dir, "video.mp4");
app.get("/stream-video", async (c) => {
  // importing file 
  const file = Bun.file(videoPath)

  // 1. Check if video exists
  if (!file) {
    return c.text("Video not found", 404);
  }
  // defining range header for the video streaming
  
  const filesize = await file.size;
  const rangeHeader = c.req.header("Range");
  // if don't have range header then we will send the whole video to the client
  if(!rangeHeader) {
    c.header('Content-Type', 'video/mp4');
    c.header('Content-Length', filesize.toString());
    c.header('Accept-Ranges', 'bytes');
    return stream(c, async (stream) => {
      await stream.pipe(file.stream());
    });

  }
  // Parsing Header Range:start-end
  const [startStr, endStr] = rangeHeader.replace('bytes=','').split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : filesize - 1;
  const chunkSize = (end - start) + 1;

  // valiadting range
  if (start >= filesize || end >= filesize) {
    c.header("Content-Range", `bytes */${filesize}`);
    return c.text("Range Not Satisfiable", 416);
  }
  c.header('Content-Type', 'video/mp4');
  c.header('Content-Range', `bytes ${start}-${end}/${filesize}`);


  c.header("Content-Type", "video/mp4"); 
  c.header("Content-Length", file.size.toString());
  c.header("Accept-Ranges", "bytes");
  c.header("Content-Range", String(chunkSize));

  return stream(c, async (stream) => {
    // fetching the video from the local device
    const chunk = file.slice(start, end + 1);
    await stream.pipe(file.stream());

  });
});


export default app;
