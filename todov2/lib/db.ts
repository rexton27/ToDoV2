import { init } from "@instantdb/react";
import schema from "@/instant.schema";

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "d45d6422-7076-4f6c-8df9-d97a22525285";

type DB = ReturnType<typeof init<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __instantdb: DB | undefined;
}

// Singleton prevents HMR from creating new WebSocket connections on each hot reload
export const db: DB = globalThis.__instantdb ?? init({ appId, schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__instantdb = db;
}
