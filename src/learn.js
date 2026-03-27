import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { stream } from "hono/streaming";
import { join } from "node:path";
import {logger} from "hono/logger";
import {readdirSync} from "fs";
//import {extname} from 'path';
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
app.post("/videosss", async (c) => {
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
// Read by video id
app.get("/videosss/:id", (c) => {
  const { id } = c.req.param();
  const video = Videos.find((video) => video.id === id);
  if (!video) {
    return c.json({ error: "Video not found" }, 404);
  }
  return c.json(video);
});
// for update the video details
app.put("/videosss/:id", async (c) => {
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
app.delete("/videosss/:id", (c) => {
  const { id } = c.req.param();
  Videos = Videos.filter((video) => video.id !== id);
  return c.json({ message: "Video deleted successfully" });
});
// Delete all videos
app.delete("/videosss", (c) => {
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
  const file = Bun.file(videoPath);

  // 1. Check if video exists
  if (!file) {
    return c.text("Video not found", 404);
  }
  // defining range header for the video streaming

  const filesize = await file.size;
  const rangeHeader = c.req.header("Range");
  // if don't have range header then we will send the whole video to the client
  if (!rangeHeader) {
    c.header("Content-Type", "video/mp4");
    c.header("Content-Length", filesize.toString());
    c.header("Accept-Ranges", "bytes");
    c.status(200);
    return stream(c, async (stream) => {
      await stream.pipe(file.stream());
    });
  }
  // Parsing Header Range:start-end
  const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : filesize - 1;
  const chunkSize = end - start + 1;
  console.log(start);
  console.log(end);

  // valiadting range
  if (start >= filesize || end >= filesize) {
    c.header("Content-Range", `bytes */${filesize}`);
    return c.text("Range Not Satisfiable", 416);
  }
  c.header("Content-Type", "video/mp4");
  c.header("Content-Range", `bytes ${start}-${end}/${filesize}`);
  c.header("Content-Length", file.size.toString());
  c.header("Accept-Ranges", "bytes");
  c.status(206);
  return stream(c, async (stream) => {
    // fetching the video from the local device
    await stream.pipe(file.slice(start,end+1).stream());
    console.log(start);
    console.log(end);
  });
});
// mime type streaming which include all kind of streaming
const MIME_TYPES = {
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mkv':  'video/x-matroska',
}
app.get("/video/:filename",(c)=>{
  const filename = c.req.param('filename');
  const ext = "." + filename.split(".").pop().toLowerCase();
  const mimeType = MIME_TYPES[ext];
  if(!mimeType){
    return c.text(`unsupported format: ${ext}`,415)
  }
  console.log(import.meta.dir);
  console.log('Filename:',filename);
  const file = Bun.file(`${import.meta.dir}/${filename}`)

  if(!file){
    return c.text('file not found',404)
  }
  const fileSize = file.size;
  const rangeHeader = c.req.header('Range');
  //
  if(!rangeHeader){
    c.header('Content-Type',mimeType);
   // c.header('Content-Length',fileSize.toString());
    c.header('Accept-Ranges','bytes');
    c.header('Transfer-Encoding','chunked');
    c.status(200);
    return stream(c,async (stream)=>{
      await stream.pipe(file.stream());
    })
  }
  //
  const [startStr,endStr] = rangeHeader.replace('bytes=','').split('-');
  const start = parseInt(startStr,10);
  const end = endStr ? parseInt(endStr,10) : fileSize-1;
  const chunkSize = end-start+1;
  if(start >= fileSize || end >= fileSize){
    c.header('Content-Range',`bytes */${fileSize}`);
    return c.text('Range Not Satisfiable',416)
  }
  c.header('Content-Type',mimeType);
  c.header('Content-Length',chunkSize.toString());
  c.header('Accept-Ranges','bytes');
  c.header('Content-Range',`bytes ${start}-${end}/${fileSize}`);
  c.status(206);
  return stream(c,async (stream)=>{
    await stream.pipe(file.slice(start,end+1).stream());
  })



}
);
app.get("/videos", (c) => {
  const files = readdirSync(join(import.meta.dir));
  const videos = files
  .filter(file=>{
    const ext = '.'+file.split('.').pop().toLowerCase();
    return MIME_TYPES[ext] && ext !== '.m3u8' && ext !== '.ts';
  })
  .map(file=>{
          const ext = "." + file.split(".").pop().toLowerCase();
          const bunFile = Bun.file(`${import.meta.dir}/${file}`);
          return {
            filename: file,
            size: bunFile.size,
            sizeInMB: (bunFile.size / (1024 * 1024)).toFixed(2) + " MB",
            mimeType: MIME_TYPES[ext],
            url: `/video/${file}`,
          };

  })
  return c.json({
    total: videos.length,
    videos
  });
});

export default app;
