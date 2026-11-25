import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nm = path.join(__dirname, "node_modules");
const pub = path.join(__dirname, "public");

function copyDir(from, to) {
  if (!fs.existsSync(from)) throw new Error("missing package files: " + from);
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

copyDir(path.join(nm, "@titaniumnetwork-dev/ultraviolet/dist"), path.join(pub, "uv"));
copyDir(path.join(nm, "@mercuryworkshop/bare-mux/dist"), path.join(pub, "baremux"));

// epoxy-transport ships a self-contained ESM bundle (wasm inlined) whose default
// export is the bare-mux transport; bare-mux dynamic-imports it by URL.
fs.rmSync(path.join(pub, "epoxy"), { recursive: true, force: true });
fs.mkdirSync(path.join(pub, "epoxy"), { recursive: true });
fs.copyFileSync(
  path.join(nm, "@mercuryworkshop/epoxy-transport/dist/index.mjs"),
  path.join(pub, "epoxy", "index.mjs")
);

const uvConfig = `self.__uv$config = {
  prefix: "/uv/service/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/uv/uv.handler.js",
  bundle: "/uv/uv.bundle.js",
  config: "/uv/uv.config.js",
  sw: "/uv/uv.sw.js",
};
`;

fs.writeFileSync(path.join(pub, "uv", "uv.config.js"), uvConfig);

// The service worker imports uv.config.js, and browsers only install a new
// worker when this script's bytes change - tag it so config edits take effect.
const swPath = path.join(pub, "uv", "sw.js");
const swHash = crypto.createHash("sha1").update(uvConfig).digest("hex").slice(0, 12);
fs.appendFileSync(swPath, `\n// portal uv.config.js ${swHash}\n`);

console.log("assets staged");
