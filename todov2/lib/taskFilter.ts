import { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export type Mood = "energised" | "overwhelmed" | "avoiding" | "calm";
export type TimeOption = 5 | 15 | 30 | 60;

type Todo = InstaQLEntity<AppSchema, "todos">;

export function filterTasks(todos: Todo[], mood: Mood): Todo[] {
  const active = todos.filter((t) => !t.done);

  switch (mood) {
    case "overwhelmed": {
      return [...active]
        .sort((a, b) => a.timeEstimate - b.timeEstimate)
        .slice(0, 3);
    }
    case "avoiding": {
      const avoidTasks = active.filter((t) => t.tag === "avoid");
      const regularTasks = active
        .filter((t) => t.tag !== "avoid")
        .sort((a, b) => a.timeEstimate - b.timeEstimate);
      return [...avoidTasks.slice(0, 1), ...regularTasks.slice(0, 2)].slice(0, 3);
    }
    case "energised": {
      return [...active]
        .sort((a, b) => b.timeEstimate - a.timeEstimate)
        .slice(0, 5);
    }
    case "calm": {
      const avoidTasks = active.filter((t) => t.tag === "avoid");
      const shortTasks = active
        .filter((t) => t.tag !== "avoid" && t.timeEstimate <= 15)
        .sort((a, b) => a.timeEstimate - b.timeEstimate);
      const longTasks = active
        .filter((t) => t.tag !== "avoid" && t.timeEstimate >= 30)
        .sort((a, b) => b.timeEstimate - a.timeEstimate);
      return [
        ...avoidTasks.slice(0, 1),
        ...shortTasks.slice(0, 2),
        ...longTasks.slice(0, 2),
      ].slice(0, 5);
    }
  }
}
