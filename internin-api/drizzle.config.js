// import { defineConfig } from "drizzle-kit";
// import "dotenv/config";

// export default defineConfig({
//   schema: "./src/db/schema.js",
//   out: "./drizzle",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
// });

import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

const isTest = process.env.NODE_ENV === "test";

dotenv.config({
  path: isTest ? ".env.test" : ".env",
});

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});