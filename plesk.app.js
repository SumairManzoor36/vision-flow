// Plesk / Phusion Passenger entry point for Vision Audit Flow Pro.
// Plesk's Node.js extension uses Phusion Passenger and looks for an "Application Startup File".
// Set this file (plesk.app.js) as the Application Startup File in the Plesk Node.js panel,
// then run `npm install` and `npm run build` from the panel before starting the app.
//
// Passenger sets process.env.PORT and listens on a unix socket on production.
// Next.js standalone server respects the PORT env var.

const { spawn } = require("child_process");
const path = require("path");

const next = spawn(
  process.execPath,
  [path.resolve(__dirname, "node_modules", "next", "dist", "bin", "next"), "start"],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  }
);

next.on("close", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGTERM", () => next.kill("SIGTERM"));
process.on("SIGINT", () => next.kill("SIGINT"));
