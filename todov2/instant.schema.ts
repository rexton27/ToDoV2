import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    todos: i.entity({
      name: i.string().indexed(),
      timeEstimate: i.number().indexed(), // 5 | 15 | 30 | 60
      tag: i.string().indexed(),          // "avoid" | (absent)
      done: i.boolean(),
      createdAt: i.number().indexed(),
      completedAt: i.number().indexed(),
    }),
    userContext: i.entity({
      lastMood: i.string(),   // "energised" | "overwhelmed" | "avoiding" | "calm"
      lastTime: i.number(),   // 5 | 15 | 30 | 60
      updatedAt: i.number(),
    }),
  },
  links: {
    todoOwner: {
      forward: { on: "todos", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "todos" },
    },
    userContextOwner: {
      forward: { on: "userContext", has: "one", label: "owner" },
      reverse: { on: "$users", has: "one", label: "context" },
    },
  },
});

export default schema;
export type AppSchema = typeof schema;
