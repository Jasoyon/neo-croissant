import { f as squareFile, i as makeSquare, y as isDrop } from "./util-Ba4iPLSj.js";
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/compat.js
/**
* Compatibility with other libraries.
*
* Convert between the formats used by chessops,
* [chessground](https://github.com/lichess-org/chessground),
* and [scalachess](https://github.com/lichess-org/scalachess).
*
* @packageDocumentation
*/
/**
* Computes the legal move destinations in the format used by chessground.
*
* Includes both possible representations of castling moves (unless
* `chess960` mode is enabled), so that the `rookCastles` option will work
* correctly.
*/
var chessgroundDests = (pos, opts) => {
	const result = /* @__PURE__ */ new Map();
	const ctx = pos.ctx();
	for (const [from, squares] of pos.allDests(ctx)) if (squares.nonEmpty()) {
		const d = Array.from(squares, makeSquare);
		if (!(opts === null || opts === void 0 ? void 0 : opts.chess960) && from === ctx.king && squareFile(from) === 4) {
			if (squares.has(0)) d.push("c1");
			else if (squares.has(56)) d.push("c8");
			if (squares.has(7)) d.push("g1");
			else if (squares.has(63)) d.push("g8");
		}
		result.set(makeSquare(from), d);
	}
	return result;
};
var chessgroundMove = (move) => isDrop(move) ? [makeSquare(move.to)] : [makeSquare(move.from), makeSquare(move.to)];
var scalachessCharPair = (move) => isDrop(move) ? String.fromCharCode(35 + move.to, 139 + [
	"queen",
	"rook",
	"bishop",
	"knight",
	"pawn"
].indexOf(move.role)) : String.fromCharCode(35 + move.from, move.promotion ? 99 + 8 * [
	"queen",
	"rook",
	"bishop",
	"knight",
	"king"
].indexOf(move.promotion) + squareFile(move.to) : 35 + move.to);
var lichessRules = (variant) => {
	switch (variant) {
		case "standard":
		case "chess960":
		case "fromPosition": return "chess";
		case "threeCheck": return "3check";
		case "kingOfTheHill": return "kingofthehill";
		case "racingKings": return "racingkings";
		default: return variant;
	}
};
var lichessVariant = (rules) => {
	switch (rules) {
		case "chess": return "standard";
		case "3check": return "threeCheck";
		case "kingofthehill": return "kingOfTheHill";
		case "racingkings": return "racingKings";
		default: return rules;
	}
};
//#endregion
export { chessgroundDests, chessgroundMove, lichessRules, lichessVariant, scalachessCharPair };

//# sourceMappingURL=chessops_compat.js.map