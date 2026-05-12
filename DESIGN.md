# MaYu — Design System & Landing Page Blueprint

## Product Identity

**Product:** MaYu — Live Poll Intelligence
**Tagline:** “From question to clarity — in real time.”

MaYu is not supposed to feel like another loud SaaS dashboard with gradients screaming for venture capital attention. It should feel calm, intelligent, premium, and quietly powerful. Like someone finally discovered software does not need to look like a crypto casino.

The design language combines:

* Japanese minimalism
* Wabi-sabi aesthetics
* Editorial SaaS layouts
* Soft realtime motion
* Calm typography hierarchy
* Intelligent spacing

---

# 1. Core Design Direction

## Design Personality

| Trait       | Meaning                                        |
| ----------- | ---------------------------------------------- |
| Minimal     | No clutter, fewer borders, more spacing        |
| Editorial   | Typography-driven layouts                      |
| Elegant     | Soft shadows, muted colors, refined animations |
| Realtime    | Smooth live updates and transitions            |
| Calm        | Avoid flashy neon overload                     |
| Intelligent | Feels like a premium analytics product         |

---

# 2. Brand System

## Brand Name Treatment

### Logo Idea

Text logo:

```txt
MaYu
```

Typography:

* “Ma” slightly heavier
* “Yu” elegant and lighter
* Optional red seal accent beside logo

### Symbol Ideas

Possible icon concepts:

* Ink pulse wave
* Circular Zen brush stroke
* Signal ripple
* Minimal torii-inspired geometry
* Rising analytics bars hidden inside a circle

---

# 3. Color System

## Primary Palette (Recommended)

### Light Theme

| Token          | Color   | Usage               |
| -------------- | ------- | ------------------- |
| bg-primary     | #F5F2ED | Main background     |
| bg-secondary   | #EDE8E1 | Cards / sections    |
| bg-elevated    | #FFFFFF | Elevated surfaces   |
| text-primary   | #1A1714 | Main text           |
| text-secondary | #6B6560 | Secondary text      |
| border-soft    | #D4CFC9 | Borders             |
| accent-primary | #C44B2B | CTAs / highlights   |
| accent-soft    | #E8A49A | Hover states        |
| success        | #3A7D5E | Published / success |
| warning        | #B7791F | Warning             |
| danger         | #9B2C2C | Errors              |

---

## Dark Theme

| Token          | Color   |
| -------------- | ------- |
| bg-primary     | #12100E |
| bg-secondary   | #1B1815 |
| bg-card        | #211D19 |
| text-primary   | #F5F2ED |
| text-secondary | #B9B2AA |
| border-soft    | #2D2924 |
| accent-primary | #D65D3D |
| success        | #4C9A74 |

---

## Alternative Color Palettes

### Option 2 — Ink & Gold

| Purpose          | Color   |
| ---------------- | ------- |
| Background       | #F8F5EF |
| Text             | #161514 |
| Accent           | #B38B59 |
| Secondary Accent | #6A7B76 |
| Border           | #DED8CF |

Mood:

* Luxury
* Editorial
* Calm enterprise

---

### Option 3 — Midnight Tokyo

| Purpose    | Color   |
| ---------- | ------- |
| Background | #0F1115 |
| Surface    | #171A21 |
| Accent     | #E14D2A |
| Text       | #F3F4F6 |
| Secondary  | #A1A1AA |

Mood:

* Developer-focused
* Modern analytics
* Hacker aesthetic but premium

---

# 4. Typography System

## Font Stack

### Headings

```css
font-family: 'Noto Serif JP', serif;
```

### Body

```css
font-family: 'Inter', sans-serif;
```

### Code / IDs

```css
font-family: 'JetBrains Mono', monospace;
```

---

## Typography Scale

| Type         | Size | Weight |
| ------------ | ---- | ------ |
| Hero Display | 72px | 600    |
| H1           | 56px | 600    |
| H2           | 40px | 600    |
| H3           | 28px | 600    |
| H4           | 22px | 500    |
| Body Large   | 18px | 400    |
| Body         | 16px | 400    |
| Small        | 14px | 400    |
| Caption      | 12px | 400    |

---

# 5. Spacing & Layout Rules

## Container Widths

| Type            | Width  |
| --------------- | ------ |
| Default         | 1280px |
| Reading Content | 860px  |
| Analytics Wide  | 1440px |

---

## Grid System

```txt
12-column responsive grid
24px gutters
```

---

## Radius System

| Usage             | Radius |
| ----------------- | ------ |
| Small Inputs      | 10px   |
| Cards             | 18px   |
| Modals            | 24px   |
| Floating Elements | 999px  |

---

## Shadow System

```css
shadow-soft: 0 4px 20px rgba(0,0,0,0.04)
shadow-medium: 0 10px 30px rgba(0,0,0,0.08)
shadow-large: 0 20px 60px rgba(0,0,0,0.12)
```

No aggressive shadows. Humanity already invented enough visual crimes.

---

# 6. Motion Design

## Motion Principles

Animations should feel:

* fluid
* intentional
* quiet
* expensive

Never bouncy.
Never chaotic.
Never “startup guy discovered Framer Motion yesterday.”

---

## Animation Specs

| Animation        | Duration |
| ---------------- | -------- |
| Hover            | 180ms    |
| Modal Open       | 320ms    |
| Page Transition  | 400ms    |
| Realtime Counter | 600ms    |
| Analytics Update | 500ms    |

---

## Motion Types

### Use:

* opacity fades
* subtle translateY
* blur reveal
* smooth number interpolation
* stagger animations

### Avoid:

* elastic springs
* shaking
* rotating nonsense
* giant parallax

---

# 7. Landing Page Design

# Landing Page Structure

```txt
Navbar
Hero
Trusted By
Features
Realtime Demo Section
How It Works
Analytics Preview
Testimonials
Pricing
FAQ
CTA Banner
Footer
```

---

# 8. Navbar

## Layout

Left:

* Logo

Center:

* Features
* Demo
* Pricing
* Docs

Right:

* Sign In
* Start Free button

---

## Navbar Style

```css
backdrop-filter: blur(12px)
background: rgba(245,242,237,0.75)
border-bottom: 1px solid rgba(0,0,0,0.04)
```

Sticky navbar.
Minimal height.
Elegant transitions.

---

# 9. Hero Section

## Layout

Two-column desktop:

Left:

* headline
* subheadline
* CTA buttons
* small social proof

Right:

* animated live analytics dashboard mockup

---

## Hero Headline

### Recommended

```txt
Pulse the room.
Instantly.
```

Alternative:

```txt
Realtime audience insight,
without the noise.
```

---

## Hero Subheadline

```txt
Create elegant live polls, gather responses in real time, and understand your audience with analytics designed for clarity.
```

---

## CTA Buttons

Primary:

```txt
Start for free
```

Secondary:

```txt
View live demo
```

---

## Hero Background Ideas

### Idea 1 — Ink Wash Animation

Subtle SVG ink clouds drifting slowly.
Opacity very low.

### Idea 2 — Live Pulse Grid

Tiny glowing dots reacting like live poll responses.

### Idea 3 — Japanese Paper Texture

Soft textured noise overlay.

---

# 10. Trusted By Section

Minimal monochrome logos.

```txt
Used by communities, classrooms, events, and teams.
```

Keep this subtle.
No gigantic fake enterprise logos pretending your hackathon app runs global civilization.

---

# 11. Features Section

## Layout

3-column grid.

Each card includes:

* icon
* title
* description
* subtle hover animation

---

## Features

### Create in Seconds

```txt
Build polls with a fast drag-and-drop editor and launch instantly.
```

### Collect Live Responses

```txt
Watch answers arrive in real time with Socket-powered updates.
```

### Understand Instantly

```txt
Realtime analytics designed for clarity, not confusion.
```

---

# 12. Realtime Demo Section

## Idea

Interactive embedded fake live poll.

User can:

* click options
* watch analytics animate live

This section massively improves conversion.
Humans enjoy pressing buttons even when they accomplish nothing. Entire industries depend on this.

---

# 13. How It Works

## 3-Step Flow

```txt
1. Create
2. Share
3. Analyze
```

Each step includes:

* minimalist illustration
* short description
* connector line

Use ink brush connectors.

---

# 14. Analytics Preview Section

## Layout

Large centered analytics dashboard preview.

Include:

* response graph
* realtime counter
* bar charts
* active poll status

Should feel:

* premium
* realtime
* intelligent

Glassmorphism only lightly.
Do not turn the dashboard into a frozen shower door.

---

# 15. Testimonials Section

## Layout

2-column staggered cards.

Soft paper card aesthetic.

Example:

```txt
“MaYu made our live workshops dramatically more interactive.”
```

---

# 16. Pricing Section

## Recommended Structure

### Free

* 5 polls
* basic analytics
* realtime updates

### Pro

* unlimited polls
* advanced analytics
* exports
* team workspaces
* API access

Highlight Pro card using vermillion border.

---

# 17. Footer

## Layout

Columns:

* Product
* Resources
* Legal
* Socials

Bottom:

```txt
Crafted for realtime clarity.
```

---

# 18. Dashboard UI Ideas

# Dashboard Layout

```txt
Sidebar
Topbar
Content Area
```

---

## Sidebar

Items:

* Dashboard
* Polls
* Analytics
* Settings
* Billing

Dark subtle sidebar works beautifully even in light theme.

---

## Poll Cards

Card includes:

* title
* status badge
* response count
* last activity
* quick actions

Hover interaction:

* slight lift
* border glow
* action reveal

---

# 19. Poll Builder Design

## UX Goal

This should feel absurdly easy.

User should be able to:

* create a poll in under 60 seconds
* never feel overwhelmed
* visually understand structure instantly

---

## Layout

Desktop:

```txt
Left → builder
Right → live preview
```

---

## Builder Features

* drag reorder
* inline editing
* keyboard shortcuts
* autosave draft
* animated insertion

---

# 20. Public Poll UI

## Design Philosophy

Respondent flow must feel frictionless.

No distractions.
No dashboard clutter.
No giant navigation.

Just:

* question
* answers
* progress
* submit

---

## Question Cards

Style:

```css
background: white
border-radius: 24px
padding: 32px
```

Selected option:

```css
border-color: accent-primary
background: rgba(196,75,43,0.08)
```

---

# 21. Analytics Dashboard

## Layout Sections

```txt
Header
Stats Row
Realtime Charts
Question Analytics
Timeline Analytics
Participant Insights
```

---

## Realtime Feel

When responses arrive:

* numbers increment smoothly
* bars animate width
* tiny pulse indicator flashes

Should feel alive.
Not like someone refreshing Excel manually in 2009.

---

# 22. Recommended Tailwind Tokens

```js
colors: {
  background: '#F5F2ED',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE8E1',
  primary: '#C44B2B',
  primarySoft: '#E8A49A',
  text: '#1A1714',
  muted: '#6B6560',
  border: '#D4CFC9',
  success: '#3A7D5E'
}
```

---

# 23. Recommended UI Libraries

## Recommended Stack

| Purpose    | Library         |
| ---------- | --------------- |
| Components | shadcn/ui       |
| Motion     | Framer Motion   |
| Charts     | Recharts        |
| Icons      | Lucide React    |
| State      | Zustand         |
| Data       | TanStack Query  |
| Forms      | React Hook Form |

---

# 24. Design Inspirations

## Product Inspirations

Study:

* Linear
* Raycast
* Notion Calendar
* Stripe Dashboard
* Vercel
* Read.cv
* Arc Browser

---

## Visual Inspirations

Search references for:

* Japanese editorial web design
* Wabi-sabi UI
* Minimal SaaS dashboards
* Luxury analytics UI
* Ink texture design

---

# 25. Advanced Design Ideas

## Feature Idea — Live Audience Pulse

Animated realtime pulse visualization showing response velocity.

Could become signature branding.

---

## Feature Idea — QR Share Mode

Fullscreen QR display for conferences and classrooms.

Beautiful animated QR frame.

---

## Feature Idea — Ambient Backgrounds

Subtle animated backgrounds depending on poll activity.

Low activity:

* calm motion

High activity:

* slightly more energetic pulse patterns

---

## Feature Idea — Presentation Mode

Large-screen analytics optimized for projectors.

Huge typography.
Realtime chart animation.

---

# 26. Mobile Design Notes

## Mobile Priorities

* thumb-friendly inputs
* giant tap targets
* simplified analytics
* reduced motion
* sticky submit CTA

---

## Mobile Navigation

Bottom navigation works better than sidebar.

---

# 27. Accessibility Rules

Mandatory:

* keyboard navigation
* aria labels
* visible focus states
* reduced motion support
* contrast compliance
* semantic HTML

Minimalism is not an excuse for inaccessible design. Humans already struggle enough clicking tiny grey text on slightly different grey backgrounds.

---

# 28. Final Visual Recommendation

## Best Direction

Use:

* warm paper backgrounds
* vermillion accents
* serif headings
* generous whitespace
* subtle realtime motion
* editorial composition

Avoid:

* neon gradients
* cyberpunk overload
* oversized shadows
* glassmorphism abuse
* cluttered dashboards

The goal is:

```txt
Elegant realtime intelligence.
```

Not:

```txt
“Three interns discovered Tailwind blur utilities.”
```
