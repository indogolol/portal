import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use((req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const httpServer = app.listen(PORT, () => console.log("listening on " + PORT));

// wisp-js 0.4 exports routeRequest instead of an attachable Server class.
httpServer.on("upgrade", (req, socket, head) => {
  if (!req.url || !req.url.startsWith("/wisp/")) return socket.destroy();
  wisp.routeRequest(req, socket, head);
});

