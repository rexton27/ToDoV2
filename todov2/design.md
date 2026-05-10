# ToDoV2 Design Reference

A living record of design decisions — what we chose, what we ruled out, and why.

---

## Philosophy

This app is built around a single idea: reduce the anxiety of a task list, not add to it. Every visual decision is weighed against one question — does this create calm or urgency?

The two primary references are:
- **Bear / Craft / Day One** — warm, spacious, borderless, content-first
- **Headspace / Calm** — desaturated accents, generous whitespace, slow transitions

---

## Color

### Palette

| Role | Light | Dark | Notes |
|---|---|---|---|
| Page background | `stone-50` | `zinc-950` | Warm white — stone sits on the warm side of neutral |
| Card / surface | `white` | `zinc-900` | Floats on the background via shadow |
| Primary text | `stone-700` | `zinc-100` | Warmer than zinc-800 — less cool, less sterile |
| Secondary text | `stone-400` | `zinc-500` | Subtitles, labels, placeholders |
| Muted / empty | `stone-300` | `zinc-600` | Em-dashes, inactive icons |
| Accent | `violet-500` | `violet-400` | See accent section below |
| Accent bg | `violet-50` | `violet-950/20` | Hover states, active row tint |
| Accent pill | `violet-100` | `violet-900/30` | Mood chip, time pill (active) |
| Pill / badge bg | `stone-100` | `zinc-800` | Inactive time pills, tags |
| Avoid badge | `amber-100` | `amber-950/30` | 👀 avoid tag — warm, not alarming |
| Avoid badge text | `amber-700` | `amber-400` | |
| Delete hover | `red-400` | `red-400` | Only on hover — not visible at rest |

### Accent color rationale

We use `violet-500` (not `violet-600`). The difference: violet-600 reads as urgent and electric — closer to a notification color. Violet-500 is the same hue but 15% quieter. It signals "here is where you act" without demanding attention.

**Ruled out:**
- `violet-600` — too energetic for a calm-focus app
- Sage / teal — considered as Direction B; would make the app feel less like a productivity tool and more like a wellness app. Left as an option if the brand direction shifts.
- Indigo — too corporate

### Why stone over zinc

Stone and zinc are both neutral grays in Tailwind, but stone has a warm (yellow-brown) undertone while zinc has a cool (blue-gray) undertone. The app background was already `stone-50`. Using zinc for all foreground text created a warm/cool mismatch. Shifting foreground text to stone makes the whole palette consistent and more grounding.

---

## Typography

| Element | Size | Weight | Color |
|---|---|---|---|
| Screen heading | `text-xl` | `font-semibold` | `stone-700` |
| Screen subheading | `text-sm` | `font-normal` | `stone-400` |
| Task name (card) | `text-sm` | `font-normal` | `stone-700` |
| Task name (table) | `text-sm` | `font-normal` | `stone-700` |
| Time pill | `text-xs` | `font-medium` | `stone-500` |
| Column headers | `text-[10px]` | `font-semibold` | `stone-400` |
| Tab labels | `text-sm` | `font-medium` | `stone-400` / `violet-500` |
| Buttons (primary) | `text-sm` | `font-medium` | `white` |
| Buttons (text) | `text-sm` | `font-medium` | `violet-500` |

**Font:** Geist (Next.js default) with `antialiased` rendering.

**Task name weight:** `font-normal`, not `font-medium`. Semibold headings + normal body = calm visual hierarchy. Medium weight on body text makes everything feel equally important.

---

## Spacing

| Element | Value | Notes |
|---|---|---|
| Card padding | `p-5` | Up from p-4 — more breathing room inside cards |
| Card gap (For you) | `gap-4` | Up from gap-3 — more air between cards |
| Page horizontal padding | `px-6` | Consistent across all screens |
| Page top padding | `py-6` | Main content area |
| Header vertical | `py-4` | Fixed chrome |
| Tab bar | `py-2.5` per tab | |
| Footer | `py-3` | |
| Max content width | `max-w-lg` | ~512px — focused, not sprawling |

---

## Elevation & Borders

### Cards use shadow, not border

```
shadow-[0_1px_6px_rgba(0,0,0,0.06)]
```

Hard borders (`border border-zinc-100`) create visual tension — the eye reads each line as a boundary to process. A very soft shadow achieves the same spatial separation without the hard edge. Cards appear to float on the surface.

**Structural dividers** (header bottom, tab bar bottom, footer top) keep their `border-b / border-t` — these are navigation landmarks, not content containers, and the hard line is appropriate there.

### Border radius

| Element | Radius |
|---|---|
| Cards | `rounded-2xl` |
| Buttons (primary) | `rounded-xl` |
| Bottom sheet | `rounded-t-3xl` |
| Pill badges / tags | `rounded-full` |
| Small icon buttons | `rounded-md` |

Consistent soft radius throughout — no sharp corners anywhere in the UI.

---

## Motion & Transitions

All transitions use `duration-200` with Tailwind's default `ease-in-out`. This is slower than Tailwind's default (150ms) — interactions feel like settling rather than snapping.

| Interaction | Animation |
|---|---|
| Hover state changes | `transition-colors duration-200` |
| Card complete (For you) | `opacity-0 scale-95`, 350ms delay before DB write |
| Card complete (All tasks) | Immediate — row disappears as DB updates |
| Button/pill all-property | `transition-all duration-200` |
| Bottom sheet (AddTask) | Slides up via `translate-y` |

**Card completion in For you:** The card fades and scales down (350ms) before the DB transaction fires. This gives the user a moment to register the action before the card disappears, without any text copy ("That counts." was removed — the gesture of the checkmark is enough).

**Card completion in All tasks:** Immediate removal. The All Tasks view is a management surface — no ceremony needed, just accuracy.

---

## Components

### TaskCard (For you tab)

- Floating card with shadow
- Name (tappable → inline edit) + circular checkmark + delete (hover-only)
- Time pill below name (tappable → inline time picker)
- No completion copy — the ○ checkmark is the only action
- `👀` emoji prefix if tagged avoid

### AllTasksView (All tasks tab)

- Table layout: `grid-cols-[1fr_64px_64px_52px]`
- Columns: Task · Time · Tag · Actions
- Inline name edit on tap, time picker spans full row when open
- Row tints `violet-50` when editing or picking time
- Circular checkmark + × delete always visible (not hover-only — this is a management view)
- Tag column: amber "👀 avoid" badge or `—` em-dash

### Tab bar

- Two tabs: "For you" / "All tasks"
- Active: `violet-500` text + `border-b-2 border-violet-500`
- Inactive: `stone-400`, no underline
- Resets to "For you" on navigation away (For you is the primary experience)

### Mood chip / time chip (header)

- Mood: `violet-100` bg, `violet-700` text — identity color of the current session
- Time: `stone-100` bg, `stone-500` text — secondary context

### Bottom sheet (AddTaskSheet)

- Two-step flow: name + time → avoid question
- Slides up from bottom, backdrop blur behind
- Dismisses on backdrop tap or close button

---

## Dark mode

Dark mode is supported throughout via `dark:` Tailwind variants. The dark palette uses zinc (cool) rather than stone — dark backgrounds read as cool/neutral naturally, so stone's warmth isn't needed there. The asymmetry (warm light, cool dark) is intentional.

---

## What we ruled out

| Decision | What we ruled out | Why |
|---|---|---|
| Completion gesture | "That counts." full-width button | Felt like validation-seeking — the checkmark is enough |
| Card borders | `border border-zinc-100` | Hard lines create tension; shadow achieves the same without the edge |
| Accent color | `violet-600` | Too energetic / urgent for a calm-focus app |
| Body text color | `zinc-800` (cool gray) | Stone neutrals are warmer and more grounding |
| Body text weight | `font-medium` | Makes everything feel equally urgent; `font-normal` creates hierarchy |
| Transition speed | 150ms (Tailwind default) | Too snappy — 200ms feels more settled |
| Completion animation | Amber flash + "That counts. ✨" | Removed the text; simplified to a clean fade |
