export default {
  todos: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id in data.ref('owner.id')"],
  },
  userContext: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id in data.ref('owner.id')"],
  },
};
