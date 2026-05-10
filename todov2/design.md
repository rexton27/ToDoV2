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

## Accessibility

Target: **WCAG 2.2 AA** throughout.

### Color contrast

| Token | Hex approx | On white | On zinc-900 | Status |
|---|---|---|---|---|
| `stone-700` (primary text) | `#44403c` | 9.7:1 | — | ✅ AAA |
| `stone-500` (pill text) | `#78716c` | 4.6:1 | — | ✅ AA |
| `stone-400` (secondary text) | `#a8a29e` | 2.7:1 | — | ⚠️ Fails AA |
| `violet-500` (accent) | `#8b5cf6` | 4.6:1 | — | ✅ AA |
| `amber-700` (avoid badge) | `#b45309` | 4.8:1 | — | ✅ AA |
| `zinc-100` (dark mode text) | `#f4f4f5` | — | 14.4:1 | ✅ AAA |

**Known gap:** `stone-400` fails AA for normal text (2.7:1 vs required 4.5:1). It is currently used for secondary text (subtitles, tab inactive, placeholders) where lower contrast is accepted as a hierarchy signal. If this needs to be addressed, shift to `stone-500` (4.6:1). Column header labels at `text-[10px]` are decorative and exempt.

### Focus styles

All interactive elements must show a visible focus ring for keyboard navigation. Never use `focus:outline-none` without a replacement. The convention:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
```

`focus-visible` (not `focus`) ensures the ring only appears for keyboard users, not on mouse click.

**Currently:** Several inputs use bare `focus:outline-none` with no ring — this is a known gap to fix.

### ARIA conventions

| Element | Required attribute |
|---|---|
| Circular checkmark button | `aria-label="Mark complete"` |
| Delete button | `aria-label="Delete task"` |
| Time picker buttons | `aria-label="Set time to X minutes"` |
| Tab buttons | `role="tab"` + `aria-selected` |
| Inline name input | `aria-label="Edit task name"` |
| Bottom sheet backdrop | `aria-hidden="true"` |

### Keyboard navigation

| Key | Behaviour |
|---|---|
| `Tab` | Moves through: task name → time pill → checkmark → delete |
| `Enter` on task name | Opens inline edit |
| `Enter` in edit input | Commits edit |
| `Escape` in edit input | Cancels, restores original name |
| `Enter` on time picker option | Selects time |
| `Escape` on time picker | Closes picker |

---

## Touch targets

Minimum tap target sizes per platform guidelines:

| Guideline | Minimum |
|---|---|
| Apple HIG | 44×44pt |
| WCAG 2.2 AA (2.5.8) | 24×24px |
| Google Material | 48×48dp |

**Current state:**

| Element | Visual size | Hit area | Status |
|---|---|---|---|
| Circular checkmark (card) | 24×24px (`w-6 h-6`) | 24×24px | ⚠️ At WCAG minimum, below Apple |
| Circular checkmark (table) | 22×22px | 22×22px | ⚠️ Below WCAG minimum |
| Delete × (table) | ~16px | ~16px | ❌ Too small |
| Time pill | Full pill width | Full pill width | ✅ |
| Tab buttons | Full width × 40px | Full width × 40px | ✅ |

**Fix:** Wrap small icon buttons in a larger invisible hit area using padding + negative margin, or increase `w-` / `h-` values. Example for checkmark:

```tsx
// Visual stays 22px, tap target becomes 44px
<button className="relative flex items-center justify-center w-11 h-11 -m-2.5">
  <span className="w-[22px] h-[22px] rounded-full border-[1.5px] ..." />
</button>
```

---

## Interaction states

Every interactive element has five states. All must be deliberately designed — no unintended browser defaults.

| State | When | Visual treatment |
|---|---|---|
| **Idle** | Default | As documented in color palette |
| **Hover** | Mouse over (desktop) | Colour shift, `duration-200` |
| **Focus** | Keyboard navigation | `ring-2 ring-violet-500 ring-offset-2` |
| **Active / pressed** | During tap/click | Slight scale down: `active:scale-95` — to be added |
| **Disabled** | Action not available | `opacity-50 cursor-not-allowed pointer-events-none` |
| **Loading** | Waiting for data | Spinner: `w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin` |
| **Error** | Failed transaction | Red border + short error message below element |

**Loading state:** InstantDB writes are optimistic — the UI updates before the server confirms, so most write operations feel instant. The loading spinner is used only for initial data fetches (`isLoading` from `db.useQuery`).

**Error state:** Not yet designed. When an InstantDB transaction fails, the optimistic update will revert automatically. A toast or inline message should surface the error. To be designed when error handling is added.

---

## Responsive design

The app is **mobile-first**. All base styles target small screens; `sm:` / `md:` breakpoints layer on top where needed.

### Breakpoints in use

| Breakpoint | Width | Behaviour |
|---|---|---|
| Default (mobile) | < 640px | Full-width layout, `px-6` padding |
| `sm` (640px+) | ≥ 640px | Not yet used — single-column layout holds |
| Content cap | `max-w-lg` (~512px) | Centred on wider screens with auto margins |

### Minimum supported width

**375px** (iPhone SE / small Android). Below this, the All Tasks grid (`grid-cols-[1fr_64px_64px_52px]`) may squeeze the task name column. No adaptation is currently implemented for sub-375px widths.

### Mobile-specific considerations

- All primary actions are reachable with one thumb in the lower two-thirds of the screen
- The bottom sheet (AddTaskSheet) slides up from the bottom — native to mobile mental model
- Hover states are desktop-only; on touch devices the interaction goes directly from idle → active
- Tap target sizes: see Touch targets section above
- Font sizes are fixed (`text-sm`, `text-xs`) — no fluid scaling. Minimum is 12px (`text-xs`) which is readable at standard mobile zoom

---

## Motion & reduced motion

### Reduced motion preference

All animations must respect `prefers-reduced-motion`. Users who enable this in their OS settings have vestibular disorders or motion sensitivity — ignoring the preference is an accessibility failure.

**Rule:** Any animation with movement (translate, scale, slide) must either be disabled or replaced with a simple opacity fade under `motion-reduce:`.

```tsx
// Card fade-out on complete
className="transition-all duration-300 motion-reduce:transition-none"

// Scale-down on complete — skip the scale entirely for reduced motion
fading ? "opacity-0 motion-reduce:opacity-100 scale-95 motion-reduce:scale-100 pointer-events-none" : ""
```

**Currently:** `motion-reduce` is not applied anywhere — this is a known gap.

### Animation inventory

| Animation | Type | Reduced motion behaviour |
|---|---|---|
| Card complete fade | `opacity-0 scale-95` | Skip scale, keep short opacity fade |
| Hover colour shifts | `transition-colors` | Can keep — colour changes are not motion |
| Bottom sheet slide | `translate-y` | Replace with instant appear (no translate) |
| Loading spinner | `animate-spin` | Remove spin, show static icon or skeleton |

---

## Performance

### Targets (Core Web Vitals)

| Metric | Target | Notes |
|---|---|---|
| First Contentful Paint | < 1.8s | InstantDB loads client-side; auth check on first render |
| Time to Interactive | < 3.9s | |
| Cumulative Layout Shift | < 0.1 | Cards must not shift on data load — use `isLoading` skeleton |
| Animation frame rate | 60fps | All transitions use GPU-compositable properties (opacity, transform) |
| Bundle size | < 200KB gzipped | Geist + InstantDB + React — monitor with `next build` output |

### Optimistic UI

InstantDB applies all writes optimistically — the UI reflects the change immediately before server confirmation. This means:

- No spinner needed on task complete, delete, name edit, or time change
- If the transaction fails, InstantDB reverts the local state automatically
- Spinners only appear on `isLoading: true` from `db.useQuery` (initial data fetch)

### Large list handling

The All Tasks table renders all active todos in a single pass. This is acceptable at low task counts (< 100). If task count grows significantly:

- **Threshold for concern:** ~200+ rows
- **Solution:** React virtualisation via `@tanstack/react-virtual`
- **Not needed now** — flag for future if usage patterns suggest it

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
