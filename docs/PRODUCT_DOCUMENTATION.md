# Campus Lost & Found - Product Documentation

This document provides a complete functional and UX-oriented overview of the Campus Lost & Found platform.

## 1. Product Goal

The app helps students and staff quickly report, discover, verify, and recover lost items with safer handoff workflows.

## 2. User Roles

- Guest user
  - View public feed and item details.
  - Must sign in for chat, report creation, save actions, and moderation actions.
- Authenticated user
  - Create lost/found reports with image + location.
  - Chat with reporter, save posts, verify ownership, mark recovered.
  - Flag suspicious content.
- Admin
  - Access moderation dashboard.
  - Review flagged reports and remove harmful content.

## 3. Main Functional Modules

### 3.1 Authentication

- Register and login using JWT.
- First registered account can be assigned admin role (bootstrap flow).

### 3.2 Report Creation (Enhanced)

Users can create high-quality reports with:

- Status: lost or found
- Item title and description
- Category and campus
- Location text and optional GPS
- Image from camera/gallery
- Last seen hint
- Urgency level: low, normal, high
- Ownership proof hint (required when status is `lost`)
- Safe meetup spot (required)
- Optional reward offer (for lost reports)
- Duplicate warning before submit
- Local draft auto-save and restore

### 3.3 Discovery and Matching

- Feed listing with filters
- Search by keyword/category/campus
- Match suggestions on item details
- Similar report prompts during report submission

### 3.4 Communication

- In-app chat between finder and owner/reporter
- Notification center for matching and moderation-related events

### 3.5 Safety and Trust

- Ownership verification token flow
- Flag suspicious reports for admin moderation
- Recovery status update (`recovered`)
- Safe meetup guidance in report + detail screens

### 3.6 Admin Operations

- Flagged item review
- Review status workflow
- Report deletion and moderation trace fields

## 4. Data Model Highlights (Item)

Enhanced item fields now include:

- `lastSeenHint`
- `urgency` (`low|normal|high`)
- `proofHint`
- `safeMeetupSpot`
- `rewardOffer`

These work together to improve safety, reduce fake claims, and speed up successful recovery.

## 5. UI/UX Decisions

### 5.1 UX Principles Used

- Clarity first: required fields and validation guidance reduce bad submissions.
- Safer recovery flows: proof hint + safe meetup fields are visible and actionable.
- Progressive detail: quick chips + advanced fields keep flow efficient.
- Confidence and trust: duplicate checks and recovery-status actions reduce confusion.
- Mobile readability: larger cards, clear icon labels, and meaningful action grouping.

### 5.2 UI Patterns Used

- Card-based sections for report clarity and visual scanning
- Status/urgency chips for fast recognition
- Summary panel before submit
- Contextual actions in item details:
  - message reporter
  - verify ownership
  - mark recovered
  - open safe meetup map

## 6. System Architecture (How Features Flow)

Architecture layers:

- Presentation Layer: React Native screens/components (`src/screens`, `src/components`)
- State Layer: React contexts (`AuthContext`, `ItemsContext`, `ThemeContext`)
- Service Layer: API and device services (`src/services`)
- API Layer: Express controllers/routes (`server/src/controllers`, `server/src/routes`)
- Data Layer: MongoDB models (`server/src/models`)

Core request flow:

1. User action on a screen triggers UI handlers.
2. Screen calls context function or service method.
3. Service sends REST request via `apiClient`.
4. Express controller validates and processes the request.
5. MongoDB model persists or retrieves data.
6. Response returns to mobile UI and updates screen state.

## 7. Mobile Computing Considerations

- Connectivity variance: report flow supports local draft persistence and recovery after interruptions.
- Permission lifecycle: camera, location, and notification flows handle deny/allow states.
- Device resource awareness: UI uses staged content sections and efficient list-driven browsing.
- Safety-driven mobile workflow: proof hint and safe meetup fields reduce risky recovery behavior.
- Session continuity: auth and item contexts preserve practical in-app flow between screens.

## 8. Screenshot Paths (`docs/doc_image`)

All screenshots are stored in:

- `docs/doc_image/`

## 8.2 Per-Image Notes (How It Works + Architecture + UI/UX)

### `docs/doc_image/login.jpg`

How it works: User submits credentials, app requests token, then authenticated features unlock.

Architecture path: `LoginScreen` -> `AuthContext.login` -> `authService` -> backend auth controller -> `User` model.

UI/UX use: focused form layout, clear call-to-action, and immediate access change after success.
Display Note: This sign-in display represents the controlled entry state required before users can access protected workflows like report creation, chat, and verification. It sets trust expectations early and clarifies the boundary between public browsing and authenticated actions.

![Login Screen](./doc_image/login.jpg)

### `docs/doc_image/home_page.jpg`

How it works: Feed loads latest reports with visual emphasis and quick discovery interactions.

Architecture path: `HomeScreen` -> `ItemsContext.fetchItems` -> `itemService.list` -> item list controller -> `Item` model.

UI/UX use: high-scan card layout, priority visibility, and motion-driven engagement.
Display Note: This home display is feed-first by design, enabling rapid report discovery through high-visibility cards and immediate interaction affordances. It is optimized for quick recognition so users can transition from scanning to decision-making in seconds.

![Home Screen](./doc_image/home_page.jpg)

### `docs/doc_image/home_page1.jpg`

How it works: Alternate home-state rendering shows additional feed visual behavior and transitions.

Architecture path: same data pipeline as home feed (`HomeScreen` + `ItemsContext` + list API).

UI/UX use: reinforces continuity with image timing/animation and stronger browsing rhythm.
Display Note: This alternate home display variant demonstrates visual engagement strategy with continuity-focused transitions and sustained browsing flow. The goal is to preserve user attention while navigating dense item streams on smaller screens.

![Home Screen Variant](./doc_image/home_page1.jpg)

### `docs/doc_image/report_item.jpg`

How it works: User enters report details, attaches image/location, and posts to backend.

Architecture path: `ReportItemScreen` -> `ItemsContext.createReport` -> `itemService.create` -> create item controller -> `Item` model.

UI/UX use: structured sections, validation-first flow, and progress clarity before submit.
Display Note: This core report display presents guided completion structure so users can submit richer, more reliable data with fewer mistakes. Better input quality directly improves matching accuracy and recovery probability.

![Report Item Screen](./doc_image/report_item.jpg)

### `docs/doc_image/lost_form.jpg`

How it works: Lost-item scenario focuses on detailed identification and recovery safety data.

Architecture path: same create pipeline; includes enhanced fields (`lastSeenHint`, `urgency`, `proofHint`, `safeMeetupSpot`, `rewardOffer`).

UI/UX use: chips + bounded inputs reduce confusion and improve report quality.
Display Note: This lost-item display emphasizes safer claim and recovery handling by foregrounding proof requirements, urgency, and meetup planning. It reduces ambiguity at claim time and supports safer person-to-person handoff planning.

![Lost Form](./doc_image/lost_form.jpg)

### `docs/doc_image/lost-found-form.jpg`

How it works: Shared form supports both lost and found reports through status-driven field behavior.

Architecture path: `ReportItemScreen` status state toggles payload mapping before `itemService.create`.

UI/UX use: single reusable flow reduces complexity while keeping context-specific guidance.
Display Note: This unified template display shows status-based behavior changes that keep one form reusable while preserving scenario-specific clarity. This design lowers learning cost while maintaining contextual relevance for each report type.

![Lost and Found Form](./doc_image/lost-found-form.jpg)

### `docs/doc_image/found-items-search.jpg`

How it works: User searches and filters to find likely matches by category/campus/keywords.

Architecture path: `SearchScreen` + filter controls -> `itemService.list(query)` -> list controller query builder -> `Item` model.

UI/UX use: filter-driven narrowing supports faster decision-making and reduced scan time.
Display Note: This search-result display is built for quick match narrowing through compact filtering patterns and high-signal item summaries. It helps users surface promising candidates quickly even when many reports are present.

![Found Items Or Search](./doc_image/found-items-search.jpg)

### `docs/doc_image/account.jpg`

How it works: User manages profile/account-level settings and accesses personal tools.

Architecture path: `AccountScreen` -> `AuthContext` and local settings services/storage.

UI/UX use: personal control center pattern with grouped actions and predictable placements.
Display Note: This account display centralizes profile and preference controls to give users predictable management of personal settings and identity context. Predictability supports confidence and repeat engagement with fewer navigation errors.

![Account Screen](./doc_image/account.jpg)

### `docs/doc_image/darkmode_account.jpg`

How it works: Same account workflow under dark theme for low-light readability.

Architecture path: `ThemeContext` toggles palette; screen consumes themed colors.

UI/UX use: contrast-aware dark mode improves comfort and visual accessibility.
Display Note: This dark-mode account display improves low-light readability with contrast tuning and consistent visual hierarchy across controls. It is designed for prolonged nighttime use and reduced visual fatigue.

![Dark Mode Account](./doc_image/darkmode_account.jpg)

### `docs/doc_image/alerts.jpg`

How it works: Notification feed shows match/moderation/recovery-related events.

Architecture path: `NotificationsScreen` -> notification service/context -> backend notification endpoints -> `Notification` model.

UI/UX use: chronological updates with clear emphasis on actionable items.
Display Note: This alert display communicates event-driven updates and directs users toward timely next actions in the recovery lifecycle. Priority-aligned event messaging helps users respond to critical updates without delay.

![Alerts Screen](./doc_image/alerts.jpg)

## 9. API and Technical References

- [API_SPEC.md](./API_SPEC.md)
- [MONGODB_SCHEMA.md](./MONGODB_SCHEMA.md)
- [FEATURE_MATRIX.md](./FEATURE_MATRIX.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [TEST_PLAN.md](./TEST_PLAN.md)

## 10. Deployment and Visibility Notes

To keep documentation visible on GitHub:

- Keep documentation links in `README.md` under Documentation Index.
- Keep screenshots under `docs/doc_image/` and reference by relative path.
- Use Markdown image embeds (see `SCREEN_GALLERY.md`) for direct rendering in GitHub.
