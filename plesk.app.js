// Plesk / Phusion Passenger entry point for Vision Audit Flow Pro.
//
// IMPORTANT: This file MUST be the process that calls .listen(PORT).
// Passenger watches the process it spawned (this file) — it does NOT
// follow child processes. Spawning `next start` as a child would leave
// Passenger waiting forever, returning empty/timeout responses to clients.
//
// We therefore use Next.js's programmatic API and start an HTTP server
// here, in-process. Passenger injects PORT (a TCP port or a Unix socket
// path depending on Plesk's Passenger build) — http.Server.listen()
// accepts both forms.
//
// Set this file (plesk.app.js) as the "Application Startup File" in the
// Plesk Node.js panel; run `npm install` + `npm run build` first.

"use strict";

const http = require("http");
const path = require("path");
const { parse } = require("url");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
// Plesk's Passenger sometimes runs the script with a CWD that is NOT
// the application root, which makes Next.js fail to find .next/. Pin it.
process.chdir(__dirname);

// Resolve Next from this app's node_modules explicitly so a global next
// install can't be picked up instead.
const next = require(path.join(__dirname, "node_modules", "next"));

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

// Passenger sets PORT. Fall back to 3000 for local sanity-checks.
// PORT can be either a numeric string ("12345") or a unix socket path
// ("/tmp/passenger.XXX/socket"). http.Server.listen handles both.
const rawPort = process.env.PORT || "3000";
const port = /^\d+$/.test(rawPort) ? parseInt(rawPort, 10) : rawPort;

function log(...args) {
  // Plesk pipes stdout/stderr of the app process into ~/logs/error_log
  // (alongside Apache messages), prefixed with "App XXXX stdout:".
  // eslint-disable-next-line no-console
  console.log("[plesk.app]", ...args);
}

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      try {
        handle(req, res, parse(req.url, true));
      } catch (err) {
        log("Request handler crashed:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    });

    server.on("error", (err) => {
      log("HTTP server error:", err);
      process.exit(1);
    });

    server.listen(port, () => {
      log(`Vision Audit Flow Pro ready on port ${port} (NODE_ENV=${process.env.NODE_ENV})`);
    });
  })
  .catch((err) => {
    log("Next.js failed to prepare:", err && err.stack ? err.stack : err);
    // Exit non-zero so Passenger reports a clean spawn failure instead of
    // hanging forever with no listener.
    process.exit(1);
  });

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
process.on("unhandledRejection", (err) => {
  log("Unhandled promise rejection:", err);
});
process.on("uncaughtException", (err) => {
  log("Uncaught exception:", err);
});
