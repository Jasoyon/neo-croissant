# Changelog

## 0.1.2 — 2026-10-11

Fix check-square edge misalignment at board widths that Chessground rounds down to physical pixels. Mount square effects in the rendered board instead of the larger outer wrapper; check, capture and landing effects now share the board geometry. Motion timing and colors are unchanged.

## 0.1.1 — 2026-10-11

Fix the piece cursor: hovering a piece shows an open hand; holding it shows a closed hand, including outside the board. Releasing, losing window focus, or unmounting the board restores the cursor. Cursor feedback remains active when reduced motion is enabled. Existing moves, sound resources and chess data are unchanged.

## 0.1.0 — 2026-10-11

First published restoration kit: Neo and green-board integration; corrected Dynamic-style motion; original default move/capture asset retrieval; legal-position preview; Chinese opening and puzzle pack; pinned source preparation, tests, macOS build, ZIP-backed installation and restoration.
