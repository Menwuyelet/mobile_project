# Screen Gallery

This gallery uses screenshots from `docs/doc_image` for GitHub-visible documentation.

## Home

How it works: Loads active reports and lets users scan, open, and act on items quickly.

Architecture: `HomeScreen` + `ItemsContext` + `itemService.list` + backend item list API.

UI/UX: Card-first visual hierarchy and motion support fast browsing.

Display Note: This main feed display demonstrates quick-scan card design where users can rapidly evaluate item details and move directly into action flows. It is tuned for mobile attention patterns, where speed and clarity strongly influence recovery success.

Display Note: This feed variant display emphasizes visual continuity, helping users maintain browsing rhythm while reviewing multiple reports. It supports efficient comparison of similar items without forcing repeated context switching between screens.

## Login

How it works: Authenticates user and unlocks protected flows (report, chat, save, verify).

Architecture: `LoginScreen` + `AuthContext` + `authService` + auth API.

UI/UX: Minimal form and clear action button to reduce login friction.

Display Note: This login display acts as the authentication gateway that establishes secure session access for all protected app capabilities. Its structure reinforces trust, identity validation, and controlled access to user-specific data.

## Report Flow

How it works: Collects item details, safety metadata, image, and location, then creates a report.

Architecture: `ReportItemScreen` + `ItemsContext.createReport` + item create API + `Item` model.

UI/UX: Guided sections, validation feedback, and confidence checks improve report quality.

Display Note: This report display highlights a high-quality submission workflow with guided sections, validation cues, and completion clarity. The goal is to maximize report usefulness while minimizing submission errors and missing details.

Display Note: This lost-form display focuses on identity confidence and recovery safety by capturing proof hints and controlled meetup context. It prepares both owner and finder for safer, more verifiable recovery coordination.

Display Note: This combined template display shows a reusable flow that cleanly adapts to both lost and found report scenarios. Reuse improves learnability for users while keeping the submission standard consistent.

## Search / Found Items

How it works: Filters and searches reports to find the best possible match.

Architecture: `SearchScreen` + query filters + `itemService.list(query)` + list query builder in backend.

UI/UX: Search narrowing and scan-friendly rows reduce effort and time.

Display Note: This search-result display demonstrates filter-based narrowing for faster potential-match discovery in high-volume item lists. It reduces search time and helps users focus on reports with the highest likelihood of relevance.

## Account

How it works: Provides personal profile/settings access and app preference controls.

Architecture: `AccountScreen` + `AuthContext` + `ThemeContext` + local storage services.

UI/UX: Consistent settings layout in light/dark themes supports clarity and comfort.

Display Note: This account display serves as the personal profile and settings center for identity, preferences, and user-level controls. It supports repeat usage by giving users a stable location for personal configuration.

Display Note: This dark-mode account display improves mobile comfort with contrast-aware typography and balanced visual emphasis. It is optimized for prolonged use and improved legibility in dim environments.

## Alerts

How it works: Displays important system events like matches and moderation updates.

Architecture: `NotificationsScreen` + notification service/API + `Notification` model.

UI/UX: Event-priority list keeps users focused on actions that matter most.

Display Note: This alerts display shows a chronological event stream with clear, actionable status updates tied to recovery workflow progress. Event ordering helps users prioritize what to respond to first when multiple updates arrive.
