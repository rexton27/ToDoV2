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
      text: i.string().indexed(),
      done: i.boolean(),
      createdAt: i.number().indexed(),
    }),
  },
  links: {
    todoOwner: {
      forward: { on: "todos", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "todos" },
    },
  },
});

export default schema;
export type AppSchema = typeof schema;
