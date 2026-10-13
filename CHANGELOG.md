# Changelog

## 0.3.0 — 2026-10-13

Add on-demand move hints with a transient green arrow and SAN. Use a separate, bounded engine process at full strength; clear hints when the position or game changes. Keep only the native takeback control. Start postgame review from the opening with full-strength tab-local analysis. Terminal positions show their result with navigation and whole-game report actions. Reports no longer require a reference database unless novelty annotation is selected, and analysis failures are surfaced.

## 0.2.2 — 2026-10-11

Fix long thinking in timed computer games: retain the existing one-second move budget when a clock is selected, and send it together with the remaining times and increments. Clamp the budget near flag fall. Advanced clock-only games keep their original time management. Add a timed-game configuration regression and real Stockfish response-time coverage.

## 0.2.1 — local candidate, 2026-10-11

Remove the Elo, skill and unrestricted-strength helper sentences from computer-game setup. Shorten the Elo heading and align the slider endpoint numbers inside the panel.

## 0.2.0 — local candidate, 2026-10-11

Add a focused computer-game setup with native engine Elo/skill bounds, color and clock presets. Keep difficulty changes local to the game. Add visible takeback, results, rematch, swap sides and PGN export; retain completed games in an analysis tab when starting another. Hide analysis during play. Reject stale engine replies after takebacks and detect terminal starting positions. Uses existing Mantine controls and concise Chinese labels.

This follows the local play flow, not the Lichess server engine or its calibrated 1–8 levels. The macOS candidate builds and tests pass; installation and visual verification remain pending because this session cannot write /Applications or serve localhost.

## 0.1.2 — 2026-10-11

Fix check-square edge misalignment at board widths that Chessground rounds down to physical pixels. Mount square effects in the rendered board instead of the larger outer wrapper; check, capture and landing effects now share the board geometry. Motion timing and colors are unchanged.

## 0.1.1 — 2026-10-11

Fix the piece cursor: hovering a piece shows an open hand; holding it shows a closed hand, including outside the board. Releasing, losing window focus, or unmounting the board restores the cursor. Cursor feedback remains active when reduced motion is enabled. Existing moves, sound resources and chess data are unchanged.

## 0.1.0 — 2026-10-11

First published restoration kit: Neo and green-board integration; corrected Dynamic-style motion; original default move/capture asset retrieval; legal-position preview; Chinese opening and puzzle pack; pinned source preparation, tests, macOS build, ZIP-backed installation and restoration.
