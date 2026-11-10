# Jukebox / Setbuilder Application Architecture Blueprint

This document captures the comprehensive implementation phases, data models, and architectural decisions for a multi-tenant, web-first live jukebox and setlist management application built with **TypeScript**.

---

## 🛠️ Core Technology Stack & Infrastructure

*   **Front-End Framework:** **Vue 3** or **React** configured with **Vite** and **TypeScript** for reactive, type-safe development.
*   **Styling:** **Tailwind CSS** utilizing an ultra-high-contrast theme for optimal readability on dim stages.
*   **Database & Backend Engine:** Flexible alignment (custom **Node.js + Express + Socket.io** backend or **Supabase** managed relational BaaS) utilizing a single persistent connection layer to guarantee millisecond updates without wasteful HTTP REST polling loops.
*   **Routing Paradigm:** Vanity slug-based routing (e.g., `app.com/musician-slug`) providing friction-free, account-free public access for audience members without requiring temporary numerical pins or room codes.

---

## 📋 Operational Execution Modes

Setlists operate under two distinct operational paradigms, modifying front-end user experience without altering underlying relational database models:

1.  **Manual Mode:** Strict, predetermined chronological ordering controlled exclusively by the musician via a `display_order` metric. Public audience routing is programmatically deactivated. Progression writes historical logs straight to the state table as songs are marked completed on stage.
2.  **Jukebox Mode:** Audience-driven execution where explicit track ordering is ignored. The audience is presented with an open pool of the musician's selected repertoire and queues tracks on a first-come, first-served (FIFO) basis.

---

## 💾 Relational Data Schema

[musicians]
│
├───► [songs] (musician_id)
│
└───► [setlists] (musician_id, type) ──► [setlist_songs]
│
[gigs] └──► [queue_entries] (gig_id, status)

### 1. `musicians` (The Tenant Profiles)
Tracks global identities, credentials, and custom public profile routing slugs.
*   `id`: `UUID` (Primary Key)
*   `email`: `VARCHAR` — Authentication entrypoint.
*   `stage_name`: `TEXT` — Public display name (e.g., "The Echoes").
*   `slug`: `VARCHAR` — Unique alphanumeric URL fragment (e.g., `theechoes` for `app.com/theechoes`).
*   `created_at`: `TIMESTAMP`

### 2. `songs` (The Master Repertoire Catalog)
A tenant's global song library. Contains rich media attachments, performance metadata, and strict band requirement configurations.
*   `id`: `UUID` (Primary Key)
*   `musician_id`: `UUID` (Foreign Key ➔ `musicians.id`)
*   `title`: `TEXT` (Required)
*   `artist`: `TEXT` (Required)
*   `album`: `TEXT` (Optional)
*   `year`: `INTEGER` (Optional)
*   `duration_seconds`: `INTEGER` — Exact runtime value used to calculate live set durations.
*   `tags`: `TEXT[]` — Array string list for categorization (e.g., `["80s", "Rock", "Acoustic"]`).
*   `pdf_url`: `TEXT` — Absolute reference link to the hosted chord chart/lyrics file sheet.
*   `required_members`: `TEXT[]` — Conditional configuration defining explicit band line-ups required to pull off the track (e.g., `["Bassist", "Backing Vocals"]`).
*   `created_at`: `TIMESTAMP`

### 3. `setlists` (The Templates)
Reusable show blueprints containing subset selections of the master catalog.
*   `id`: `UUID` (Primary Key)
*   `musician_id`: `UUID` (Foreign Key ➔ `musicians.id`)
*   `name`: `TEXT` — Identifiable template name (e.g., "3-Hour Heavy Set").
*   `type`: `VARCHAR` — Performance configuration flag. Allowed values: `['manual', 'jukebox']`.
*   `created_at`: `TIMESTAMP`

### 4. `setlist_songs` (The Structural Blueprint Junction)
Resolves many-to-many relationship mappings between master song records and reusable templates.
*   `id`: `UUID` (Primary Key)
*   `setlist_id`: `UUID` (Foreign Key ➔ `setlists.id` ON DELETE CASCADE)
*   `song_id`: `UUID` (Foreign Key ➔ `songs.id` ON DELETE CASCADE)
*   `display_order`: `INTEGER` — Sequential baseline ranking used explicitly to drive **Manual Mode** logic.

### 5. `gigs` (The Performance Windows)
The runtime wrapper managing individual execution instances of a setlist over time. Protects historical tracking data and acts as the state isolation wall between past and current performances.
*   `id`: `UUID` (Primary Key)
*   `setlist_id`: `UUID` (Foreign Key ➔ `setlists.id`)
*   `is_active`: `BOOLEAN` — When true, designates the active performance window. Business rules mandate a constraint of only one active gig row per musician at any given time.
*   `created_at`: `TIMESTAMP`

### 6. `queue_entries` (The Live Performance Ledger)
The active, high-precision state machine tracker managing sequential progression on stage. Ordered via a `created_at ASC` constraint to achieve a strict first-come, first-served (FIFO) priority structure.
*   `id`: `UUID` (Primary Key)
*   `gig_id`: `UUID` (Foreign Key ➔ `gigs.id`) — Hooks entries directly to an explicit event timeline.
*   `song_id`: `UUID` (Foreign Key ➔ `songs.id`) — The record chosen for play.
*   `requester_name`: `TEXT` (Optional) — Custom alias typed in by audience members.
*   `status`: `VARCHAR` — State management transitions. Valid lifecycle states:
    *   `'pending'`: Awaiting performance in the incoming queue stack.
    *   `'playing'`: Currently active tracking choice visible on stage.
    *   `'completed'`: Successfully played and signed off by the performer.
    *   `'skipped'`: Discarded, bypassed, or rejected manually by the artist.
*   `created_at`: `TIMESTAMP` — High-resolution timestamp metric enforcing FIFO ordering rules.

---

## ⚡ Performance, Scaling & UI Synchronization Optimization

*   **Database Query Speed:** To guarantee a sub-5ms lookup runtime across hundreds of thousands of historical entries in a scaling multi-tenant system, a compound query index is established on the state ledger columns:
    ```sql
    CREATE INDEX idx_queue_lookup ON queue_entries (gig_id, status);
    ```
*   **The In-Memory UI Lockout Map:** To protect backend compute layers from heavy load loops on public audience views, the frontend converts the live queue array into a high-performance, single-pass Reactive JavaScript `Set` (or dictionary lookup map) containing active track IDs:
    ```typescript
    // constant-time O(1) evaluation layer preventing duplicate request entries
    const lockedTrackMap = computed(() => new Set(liveQueue.filter(e => ['pending', 'playing'].includes(e.status)).map(e => e.song_id)));
    ```

---

## 🚀 Incremental Implementation Phasing

### Phase 1: Local Master Catalog & Setlist CRUD
*   Establish Vite + TypeScript project structure.
*   Implement localized master `songs` array management interface views with rich metadata creation forms.
*   Construct template-builder layouts allowing compilation of items into named `setlists` arrays featuring customizable fallback sequential numbers (`display_order`).

### Phase 2: Live Gig State & Queue Management
*   Implement mock backend mechanics simulating the `gigs` transaction boundary.
*   Build out the primary Musician Stage Dashboard featuring giant, high-contrast, swipeable views displaying the active song, underlying chord-sheet PDF frames, and the incoming queue timeline.
*   Implement the underlying FIFO logic handlers managing state mutations when the musician hits "Next Track" or skips records.

### Phase 3: Vanity Routing & Public Audience View
*   Wire up front-end router layers to handle variable parameter parsing (`app.com/:slug`).
*   Build a sleek, lightweight, mobile-optimized public view fetching the current active gig song pool belonging to the specific vanity parameter.
*   Implement the "Submit Request" transaction view and link user local storage configurations to write anonymous session tokens protecting against automated crowd spam.

### Phase 4: Network Connectivity, Streaming Sync & Infrastructure
*   Select, construct, and deploy persistent storage and real-time database layers (Supabase configuration vs Node/Express WebSockets server orchestration).
*   Switch front-end components to persistent real-time listeners, instantly syncing audience interactions from mobile web view clicks directly into the musician's dark-mode dashboard on stage.