# Changelog

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
