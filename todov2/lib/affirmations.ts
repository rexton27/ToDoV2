export const AFFIRMATIONS = [
  "One thing at a time.",
  "You don't have to do it all today.",
  "Small steps count.",
  "Rest is part of the work.",
  "Progress, not perfection.",
  "You're allowed to go slowly.",
  "What you do today is enough.",
  "Steady wins.",
  "It's okay to start small.",
  "One task, then breathe.",
  "Finishing something counts.",
  "You're already doing it.",
  "Gentle is fine.",
  "Less is more today.",
  "Just begin.",
  "Every small step moves you forward.",
  "Today doesn't have to be perfect.",
  "You've done hard things before.",
  "One moment at a time.",
  "Show up, that's enough.",
] as const;

export function getDailyAffirmation(): string {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}
