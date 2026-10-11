import { i as n, n as boardEquals, r as SquareSet, t as Board } from "./board-cv2zIgd0.js";
import { d as rookCastlesTo, f as squareFile, g as COLORS, h as CASTLING_SIDES, m as squareRank, n as defined, r as kingCastlesTo, s as opposite, y as isDrop } from "./util-Ba4iPLSj.js";
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/attacks.js
/**
* Compute attacks and rays.
*
* These are low-level functions that can be used to implement chess rules.
*
* Implementation notes: Sliding attacks are computed using
* [Hyperbola Quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
* Magic Bitboards would deliver slightly faster lookups, but also require
* initializing considerably larger attack tables. On the web, initialization
* time is important, so the chosen method may strike a better balance.
*
* @packageDocumentation
*/
var computeRange = (square, deltas) => {
	let range = SquareSet.empty();
	for (const delta of deltas) {
		const sq = square + delta;
		if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) range = range.with(sq);
	}
	return range;
};
var tabulate = (f) => {
	const table = [];
	for (let square = 0; square < 64; square++) table[square] = f(square);
	return table;
};
var KING_ATTACKS = tabulate((sq) => computeRange(sq, [
	-9,
	-8,
	-7,
	-1,
	1,
	7,
	8,
	9
]));
var KNIGHT_ATTACKS = tabulate((sq) => computeRange(sq, [
	-17,
	-15,
	-10,
	-6,
	6,
	10,
	15,
	17
]));
var PAWN_ATTACKS = {
	white: tabulate((sq) => computeRange(sq, [7, 9])),
	black: tabulate((sq) => computeRange(sq, [-7, -9]))
};
/**
* Gets squares attacked or defended by a king on `square`.
*/
var kingAttacks = (square) => KING_ATTACKS[square];
/**
* Gets squares attacked or defended by a knight on `square`.
*/
var knightAttacks = (square) => KNIGHT_ATTACKS[square];
/**
* Gets squares attacked or defended by a pawn of the given `color`
* on `square`.
*/
var pawnAttacks = (color, square) => PAWN_ATTACKS[color][square];
var FILE_RANGE = tabulate((sq) => SquareSet.fromFile(squareFile(sq)).without(sq));
var RANK_RANGE = tabulate((sq) => SquareSet.fromRank(squareRank(sq)).without(sq));
var DIAG_RANGE = tabulate((sq) => {
	const diag = new SquareSet(134480385, 2151686160);
	const shift = 8 * (squareRank(sq) - squareFile(sq));
	return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});
var ANTI_DIAG_RANGE = tabulate((sq) => {
	const diag = new SquareSet(270549120, 16909320);
	const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
	return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});
var hyperbola = (bit, range, occupied) => {
	let forward = occupied.intersect(range);
	let reverse = forward.bswap64();
	forward = forward.minus64(bit);
	reverse = reverse.minus64(bit.bswap64());
	return forward.xor(reverse.bswap64()).intersect(range);
};
var fileAttacks = (square, occupied) => hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
var rankAttacks = (square, occupied) => {
	const range = RANK_RANGE[square];
	let forward = occupied.intersect(range);
	let reverse = forward.rbit64();
	forward = forward.minus64(SquareSet.fromSquare(square));
	reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
	return forward.xor(reverse.rbit64()).intersect(range);
};
/**
* Gets squares attacked or defended by a bishop on `square`, given `occupied`
* squares.
*/
var bishopAttacks = (square, occupied) => {
	const bit = SquareSet.fromSquare(square);
	return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
};
/**
* Gets squares attacked or defended by a rook on `square`, given `occupied`
* squares.
*/
var rookAttacks = (square, occupied) => fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
/**
* Gets squares attacked or defended by a queen on `square`, given `occupied`
* squares.
*/
var queenAttacks = (square, occupied) => bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
/**
* Gets squares attacked or defended by a `piece` on `square`, given
* `occupied` squares.
*/
var attacks = (piece, square, occupied) => {
	switch (piece.role) {
		case "pawn": return pawnAttacks(piece.color, square);
		case "knight": return knightAttacks(square);
		case "bishop": return bishopAttacks(square, occupied);
		case "rook": return rookAttacks(square, occupied);
		case "queen": return queenAttacks(square, occupied);
		case "king": return kingAttacks(square);
	}
};
/**
* Gets all squares of the rank, file or diagonal with the two squares
* `a` and `b`, or an empty set if they are not aligned.
*/
var ray = (a, b) => {
	const other = SquareSet.fromSquare(b);
	if (RANK_RANGE[a].intersects(other)) return RANK_RANGE[a].with(a);
	if (ANTI_DIAG_RANGE[a].intersects(other)) return ANTI_DIAG_RANGE[a].with(a);
	if (DIAG_RANGE[a].intersects(other)) return DIAG_RANGE[a].with(a);
	if (FILE_RANGE[a].intersects(other)) return FILE_RANGE[a].with(a);
	return SquareSet.empty();
};
/**
* Gets all squares between `a` and `b` (bounds not included), or an empty set
* if they are not on the same rank, file or diagonal.
*/
var between = (a, b) => ray(a, b).intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b))).withoutFirst();
//#endregion
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/chess.js
var IllegalSetup;
(function(IllegalSetup) {
	IllegalSetup["Empty"] = "ERR_EMPTY";
	IllegalSetup["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
	IllegalSetup["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
	IllegalSetup["Kings"] = "ERR_KINGS";
	IllegalSetup["Variant"] = "ERR_VARIANT";
})(IllegalSetup || (IllegalSetup = {}));
var PositionError = class extends Error {};
var attacksTo = (square, attacker, board, occupied) => board[attacker].intersect(rookAttacks(square, occupied).intersect(board.rooksAndQueens()).union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens())).union(knightAttacks(square).intersect(board.knight)).union(kingAttacks(square).intersect(board.king)).union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
var Castles = class Castles {
	constructor() {}
	static default() {
		const castles = new Castles();
		castles.castlingRights = SquareSet.corners();
		castles.rook = {
			white: {
				a: 0,
				h: 7
			},
			black: {
				a: 56,
				h: 63
			}
		};
		castles.path = {
			white: {
				a: new SquareSet(14, 0),
				h: new SquareSet(96, 0)
			},
			black: {
				a: new SquareSet(0, 234881024),
				h: new SquareSet(0, 1610612736)
			}
		};
		return castles;
	}
	static empty() {
		const castles = new Castles();
		castles.castlingRights = SquareSet.empty();
		castles.rook = {
			white: {
				a: void 0,
				h: void 0
			},
			black: {
				a: void 0,
				h: void 0
			}
		};
		castles.path = {
			white: {
				a: SquareSet.empty(),
				h: SquareSet.empty()
			},
			black: {
				a: SquareSet.empty(),
				h: SquareSet.empty()
			}
		};
		return castles;
	}
	clone() {
		const castles = new Castles();
		castles.castlingRights = this.castlingRights;
		castles.rook = {
			white: {
				a: this.rook.white.a,
				h: this.rook.white.h
			},
			black: {
				a: this.rook.black.a,
				h: this.rook.black.h
			}
		};
		castles.path = {
			white: {
				a: this.path.white.a,
				h: this.path.white.h
			},
			black: {
				a: this.path.black.a,
				h: this.path.black.h
			}
		};
		return castles;
	}
	add(color, side, king, rook) {
		const kingTo = kingCastlesTo(color, side);
		const rookTo = rookCastlesTo(color, side);
		this.castlingRights = this.castlingRights.with(rook);
		this.rook[color][side] = rook;
		this.path[color][side] = between(rook, rookTo).with(rookTo).union(between(king, kingTo).with(kingTo)).without(king).without(rook);
	}
	static fromSetup(setup) {
		const castles = Castles.empty();
		const rooks = setup.castlingRights.intersect(setup.board.rook);
		for (const color of COLORS) {
			const backrank = SquareSet.backrank(color);
			const king = setup.board.kingOf(color);
			if (!defined(king) || !backrank.has(king)) continue;
			const side = rooks.intersect(setup.board[color]).intersect(backrank);
			const aSide = side.first();
			if (defined(aSide) && aSide < king) castles.add(color, "a", king, aSide);
			const hSide = side.last();
			if (defined(hSide) && king < hSide) castles.add(color, "h", king, hSide);
		}
		return castles;
	}
	discardRook(square) {
		if (this.castlingRights.has(square)) {
			this.castlingRights = this.castlingRights.without(square);
			for (const color of COLORS) for (const side of CASTLING_SIDES) if (this.rook[color][side] === square) this.rook[color][side] = void 0;
		}
	}
	discardColor(color) {
		this.castlingRights = this.castlingRights.diff(SquareSet.backrank(color));
		this.rook[color].a = void 0;
		this.rook[color].h = void 0;
	}
};
var Position = class {
	constructor(rules) {
		this.rules = rules;
	}
	reset() {
		this.board = Board.default();
		this.pockets = void 0;
		this.turn = "white";
		this.castles = Castles.default();
		this.epSquare = void 0;
		this.remainingChecks = void 0;
		this.halfmoves = 0;
		this.fullmoves = 1;
	}
	setupUnchecked(setup) {
		this.board = setup.board.clone();
		this.board.promoted = SquareSet.empty();
		this.pockets = void 0;
		this.turn = setup.turn;
		this.castles = Castles.fromSetup(setup);
		this.epSquare = validEpSquare(this, setup.epSquare);
		this.remainingChecks = void 0;
		this.halfmoves = setup.halfmoves;
		this.fullmoves = setup.fullmoves;
	}
	kingAttackers(square, attacker, occupied) {
		return attacksTo(square, attacker, this.board, occupied);
	}
	playCaptureAt(square, captured) {
		this.halfmoves = 0;
		if (captured.role === "rook") this.castles.discardRook(square);
		if (this.pockets) this.pockets[opposite(captured.color)][captured.promoted ? "pawn" : captured.role]++;
	}
	ctx() {
		const variantEnd = this.isVariantEnd();
		const king = this.board.kingOf(this.turn);
		if (!defined(king)) return {
			king,
			blockers: SquareSet.empty(),
			checkers: SquareSet.empty(),
			variantEnd,
			mustCapture: false
		};
		const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens()).union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[opposite(this.turn)]);
		let blockers = SquareSet.empty();
		for (const sniper of snipers) {
			const b = between(king, sniper).intersect(this.board.occupied);
			if (!b.moreThanOne()) blockers = blockers.union(b);
		}
		const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
		return {
			king,
			blockers,
			checkers,
			variantEnd,
			mustCapture: false
		};
	}
	clone() {
		var _a, _b;
		const pos = new this.constructor();
		pos.board = this.board.clone();
		pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
		pos.turn = this.turn;
		pos.castles = this.castles.clone();
		pos.epSquare = this.epSquare;
		pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
		pos.halfmoves = this.halfmoves;
		pos.fullmoves = this.fullmoves;
		return pos;
	}
	validate() {
		if (this.board.occupied.isEmpty()) return n.err(new PositionError(IllegalSetup.Empty));
		if (this.board.king.size() !== 2) return n.err(new PositionError(IllegalSetup.Kings));
		if (!defined(this.board.kingOf(this.turn))) return n.err(new PositionError(IllegalSetup.Kings));
		const otherKing = this.board.kingOf(opposite(this.turn));
		if (!defined(otherKing)) return n.err(new PositionError(IllegalSetup.Kings));
		if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) return n.err(new PositionError(IllegalSetup.OppositeCheck));
		if (SquareSet.backranks().intersects(this.board.pawn)) return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
		return n.ok(void 0);
	}
	dropDests(_ctx) {
		return SquareSet.empty();
	}
	dests(square, ctx) {
		ctx = ctx || this.ctx();
		if (ctx.variantEnd) return SquareSet.empty();
		const piece = this.board.get(square);
		if (!piece || piece.color !== this.turn) return SquareSet.empty();
		let pseudo, legal;
		if (piece.role === "pawn") {
			pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
			const delta = this.turn === "white" ? 8 : -8;
			const step = square + delta;
			if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
				pseudo = pseudo.with(step);
				const canDoubleStep = this.turn === "white" ? square < 16 : square >= 48;
				const doubleStep = step + delta;
				if (canDoubleStep && !this.board.occupied.has(doubleStep)) pseudo = pseudo.with(doubleStep);
			}
			if (defined(this.epSquare) && canCaptureEp(this, square, ctx)) legal = SquareSet.fromSquare(this.epSquare);
		} else if (piece.role === "bishop") pseudo = bishopAttacks(square, this.board.occupied);
		else if (piece.role === "knight") pseudo = knightAttacks(square);
		else if (piece.role === "rook") pseudo = rookAttacks(square, this.board.occupied);
		else if (piece.role === "queen") pseudo = queenAttacks(square, this.board.occupied);
		else pseudo = kingAttacks(square);
		pseudo = pseudo.diff(this.board[this.turn]);
		if (defined(ctx.king)) {
			if (piece.role === "king") {
				const occ = this.board.occupied.without(square);
				for (const to of pseudo) if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty()) pseudo = pseudo.without(to);
				return pseudo.union(castlingDest(this, "a", ctx)).union(castlingDest(this, "h", ctx));
			}
			if (ctx.checkers.nonEmpty()) {
				const checker = ctx.checkers.singleSquare();
				if (!defined(checker)) return SquareSet.empty();
				pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
			}
			if (ctx.blockers.has(square)) pseudo = pseudo.intersect(ray(square, ctx.king));
		}
		if (legal) pseudo = pseudo.union(legal);
		return pseudo;
	}
	isVariantEnd() {
		return false;
	}
	variantOutcome(_ctx) {}
	hasInsufficientMaterial(color) {
		if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()) return false;
		if (this.board[color].intersects(this.board.knight)) return this.board[color].size() <= 2 && this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty();
		if (this.board[color].intersects(this.board.bishop)) return (!this.board.bishop.intersects(SquareSet.darkSquares()) || !this.board.bishop.intersects(SquareSet.lightSquares())) && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
		return true;
	}
	toSetup() {
		var _a, _b;
		return {
			board: this.board.clone(),
			pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
			turn: this.turn,
			castlingRights: this.castles.castlingRights,
			epSquare: legalEpSquare(this),
			remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
			halfmoves: Math.min(this.halfmoves, 150),
			fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999)
		};
	}
	isInsufficientMaterial() {
		return COLORS.every((color) => this.hasInsufficientMaterial(color));
	}
	hasDests(ctx) {
		ctx = ctx || this.ctx();
		for (const square of this.board[this.turn]) if (this.dests(square, ctx).nonEmpty()) return true;
		return this.dropDests(ctx).nonEmpty();
	}
	isLegal(move, ctx) {
		if (isDrop(move)) {
			if (!this.pockets || this.pockets[this.turn][move.role] <= 0) return false;
			if (move.role === "pawn" && SquareSet.backranks().has(move.to)) return false;
			return this.dropDests(ctx).has(move.to);
		} else {
			if (move.promotion === "pawn") return false;
			if (move.promotion === "king" && this.rules !== "antichess") return false;
			if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to))) return false;
			const dests = this.dests(move.from, ctx);
			return dests.has(move.to) || dests.has(normalizeMove(this, move).to);
		}
	}
	isCheck() {
		const king = this.board.kingOf(this.turn);
		return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
	}
	isEnd(ctx) {
		if (ctx ? ctx.variantEnd : this.isVariantEnd()) return true;
		return this.isInsufficientMaterial() || !this.hasDests(ctx);
	}
	isCheckmate(ctx) {
		ctx = ctx || this.ctx();
		return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
	}
	isStalemate(ctx) {
		ctx = ctx || this.ctx();
		return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
	}
	outcome(ctx) {
		const variantOutcome = this.variantOutcome(ctx);
		if (variantOutcome) return variantOutcome;
		ctx = ctx || this.ctx();
		if (this.isCheckmate(ctx)) return { winner: opposite(this.turn) };
		else if (this.isInsufficientMaterial() || this.isStalemate(ctx)) return { winner: void 0 };
		else return;
	}
	allDests(ctx) {
		ctx = ctx || this.ctx();
		const d = /* @__PURE__ */ new Map();
		if (ctx.variantEnd) return d;
		for (const square of this.board[this.turn]) d.set(square, this.dests(square, ctx));
		return d;
	}
	play(move) {
		const turn = this.turn;
		const epSquare = this.epSquare;
		const castling = castlingSide(this, move);
		this.epSquare = void 0;
		this.halfmoves += 1;
		if (turn === "black") this.fullmoves += 1;
		this.turn = opposite(turn);
		if (isDrop(move)) {
			this.board.set(move.to, {
				role: move.role,
				color: turn
			});
			if (this.pockets) this.pockets[turn][move.role]--;
			if (move.role === "pawn") this.halfmoves = 0;
		} else {
			const piece = this.board.take(move.from);
			if (!piece) return;
			let epCapture;
			if (piece.role === "pawn") {
				this.halfmoves = 0;
				if (move.to === epSquare) epCapture = this.board.take(move.to + (turn === "white" ? -8 : 8));
				const delta = move.from - move.to;
				if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) this.epSquare = move.from + move.to >> 1;
				if (move.promotion) {
					piece.role = move.promotion;
					piece.promoted = !!this.pockets;
				}
			} else if (piece.role === "rook") this.castles.discardRook(move.from);
			else if (piece.role === "king") {
				if (castling) {
					const rookFrom = this.castles.rook[turn][castling];
					if (defined(rookFrom)) {
						const rook = this.board.take(rookFrom);
						this.board.set(kingCastlesTo(turn, castling), piece);
						if (rook) this.board.set(rookCastlesTo(turn, castling), rook);
					}
				}
				this.castles.discardColor(turn);
			}
			if (!castling) {
				const capture = this.board.set(move.to, piece) || epCapture;
				if (capture) this.playCaptureAt(move.to, capture);
			}
		}
		if (this.remainingChecks) {
			if (this.isCheck()) this.remainingChecks[turn] = Math.max(this.remainingChecks[turn] - 1, 0);
		}
	}
};
var Chess = class extends Position {
	constructor() {
		super("chess");
	}
	static default() {
		const pos = new this();
		pos.reset();
		return pos;
	}
	static fromSetup(setup) {
		const pos = new this();
		pos.setupUnchecked(setup);
		return pos.validate().map((_) => pos);
	}
	clone() {
		return super.clone();
	}
};
var validEpSquare = (pos, square) => {
	if (!defined(square)) return;
	const epRank = pos.turn === "white" ? 5 : 2;
	const forward = pos.turn === "white" ? 8 : -8;
	if (squareRank(square) !== epRank) return;
	if (pos.board.occupied.has(square + forward)) return;
	const pawn = square - forward;
	if (!pos.board.pawn.has(pawn) || !pos.board[opposite(pos.turn)].has(pawn)) return;
	return square;
};
var legalEpSquare = (pos) => {
	if (!defined(pos.epSquare)) return;
	const ctx = pos.ctx();
	const candidates = pos.board.pieces(pos.turn, "pawn").intersect(pawnAttacks(opposite(pos.turn), pos.epSquare));
	for (const candidate of candidates) if (pos.dests(candidate, ctx).has(pos.epSquare)) return pos.epSquare;
};
var canCaptureEp = (pos, pawnFrom, ctx) => {
	if (!defined(pos.epSquare)) return false;
	if (!pawnAttacks(pos.turn, pawnFrom).has(pos.epSquare)) return false;
	if (!defined(ctx.king)) return true;
	const delta = pos.turn === "white" ? 8 : -8;
	const captured = pos.epSquare - delta;
	return pos.kingAttackers(ctx.king, opposite(pos.turn), pos.board.occupied.toggle(pawnFrom).toggle(captured).with(pos.epSquare)).without(captured).isEmpty();
};
var castlingDest = (pos, side, ctx) => {
	if (!defined(ctx.king) || ctx.checkers.nonEmpty()) return SquareSet.empty();
	const rook = pos.castles.rook[pos.turn][side];
	if (!defined(rook)) return SquareSet.empty();
	if (pos.castles.path[pos.turn][side].intersects(pos.board.occupied)) return SquareSet.empty();
	const kingTo = kingCastlesTo(pos.turn, side);
	const kingPath = between(ctx.king, kingTo);
	const occ = pos.board.occupied.without(ctx.king);
	for (const sq of kingPath) if (pos.kingAttackers(sq, opposite(pos.turn), occ).nonEmpty()) return SquareSet.empty();
	const rookTo = rookCastlesTo(pos.turn, side);
	const after = pos.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
	if (pos.kingAttackers(kingTo, opposite(pos.turn), after).nonEmpty()) return SquareSet.empty();
	return SquareSet.fromSquare(rook);
};
var pseudoDests = (pos, square, ctx) => {
	if (ctx.variantEnd) return SquareSet.empty();
	const piece = pos.board.get(square);
	if (!piece || piece.color !== pos.turn) return SquareSet.empty();
	let pseudo = attacks(piece, square, pos.board.occupied);
	if (piece.role === "pawn") {
		let captureTargets = pos.board[opposite(pos.turn)];
		if (defined(pos.epSquare)) captureTargets = captureTargets.with(pos.epSquare);
		pseudo = pseudo.intersect(captureTargets);
		const delta = pos.turn === "white" ? 8 : -8;
		const step = square + delta;
		if (0 <= step && step < 64 && !pos.board.occupied.has(step)) {
			pseudo = pseudo.with(step);
			const canDoubleStep = pos.turn === "white" ? square < 16 : square >= 48;
			const doubleStep = step + delta;
			if (canDoubleStep && !pos.board.occupied.has(doubleStep)) pseudo = pseudo.with(doubleStep);
		}
		return pseudo;
	} else pseudo = pseudo.diff(pos.board[pos.turn]);
	if (square === ctx.king) return pseudo.union(castlingDest(pos, "a", ctx)).union(castlingDest(pos, "h", ctx));
	else return pseudo;
};
var equalsIgnoreMoves = (left, right) => {
	var _a, _b;
	return left.rules === right.rules && boardEquals(left.board, right.board) && (right.pockets && ((_a = left.pockets) === null || _a === void 0 ? void 0 : _a.equals(right.pockets)) || !left.pockets && !right.pockets) && left.turn === right.turn && left.castles.castlingRights.equals(right.castles.castlingRights) && legalEpSquare(left) === legalEpSquare(right) && (right.remainingChecks && ((_b = left.remainingChecks) === null || _b === void 0 ? void 0 : _b.equals(right.remainingChecks)) || !left.remainingChecks && !right.remainingChecks);
};
var castlingSide = (pos, move) => {
	if (isDrop(move)) return;
	const delta = move.to - move.from;
	if (Math.abs(delta) !== 2 && !pos.board[pos.turn].has(move.to)) return;
	if (!pos.board.king.has(move.from)) return;
	return delta > 0 ? "h" : "a";
};
var normalizeMove = (pos, move) => {
	const side = castlingSide(pos, move);
	if (!side) return move;
	const rookFrom = pos.castles.rook[pos.turn][side];
	return {
		from: move.from,
		to: defined(rookFrom) ? rookFrom : move.to
	};
};
var isStandardMaterialSide = (board, color) => {
	const promoted = Math.max(board.pieces(color, "queen").size() - 1, 0) + Math.max(board.pieces(color, "rook").size() - 2, 0) + Math.max(board.pieces(color, "knight").size() - 2, 0) + Math.max(board.pieces(color, "bishop").intersect(SquareSet.lightSquares()).size() - 1, 0) + Math.max(board.pieces(color, "bishop").intersect(SquareSet.darkSquares()).size() - 1, 0);
	return board.pieces(color, "pawn").size() + promoted <= 8;
};
var isStandardMaterial = (pos) => COLORS.every((color) => isStandardMaterialSide(pos.board, color));
var isImpossibleCheck = (pos) => {
	const ourKing = pos.board.kingOf(pos.turn);
	if (!defined(ourKing)) return false;
	const checkers = pos.kingAttackers(ourKing, opposite(pos.turn), pos.board.occupied);
	if (checkers.isEmpty()) return false;
	if (defined(pos.epSquare)) {
		const pushedTo = pos.epSquare ^ 8;
		const pushedFrom = pos.epSquare ^ 24;
		return checkers.moreThanOne() || checkers.first() !== pushedTo && pos.kingAttackers(ourKing, opposite(pos.turn), pos.board.occupied.without(pushedTo).with(pushedFrom)).nonEmpty();
	} else if (pos.rules === "atomic") return false;
	else return checkers.size() > 2 || checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing);
};
//#endregion
export { Castles, Chess, IllegalSetup, Position, PositionError, castlingSide, equalsIgnoreMoves, isImpossibleCheck, isStandardMaterial, isStandardMaterialSide, normalizeMove, pseudoDests };

//# sourceMappingURL=chessops_chess.js.map