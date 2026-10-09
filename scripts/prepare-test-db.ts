import "dotenv/config";
import mariadb from "mariadb";
import { spawnSync } from "node:child_process";
const kind = process.argv[2] === "e2e" ? "soultoy_e2e" : "soultoy_test";
const url = new URL(process.env.DATABASE_URL!);
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});
await connection.query(
  "CREATE DATABASE IF NOT EXISTS " +
    kind +
    " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
);
await connection.end();
url.pathname = "/" + kind;
const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url.href } },
);
process.exitCode = result.status ?? 1;
