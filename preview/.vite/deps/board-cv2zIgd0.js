import { g as COLORS, v as ROLES } from "./util-Ba4iPLSj.js";
//#region ../en-croissant/node_modules/.pnpm/@badrap+result@0.2.13/node_modules/@badrap/result/dist/index.modern.mjs
var r = class {
	unwrap(r, t) {
		const e = this._chain((t) => n.ok(r ? r(t) : t), (r) => t ? n.ok(t(r)) : n.err(r));
		if (e.isErr) throw e.error;
		return e.value;
	}
	map(r, t) {
		return this._chain((t) => n.ok(r(t)), (r) => n.err(t ? t(r) : r));
	}
	chain(r, t) {
		return this._chain(r, t || ((r) => n.err(r)));
	}
};
var t = class extends r {
	constructor(r) {
		super(), this.value = void 0, this.isOk = !0, this.isErr = !1, this.value = r;
	}
	_chain(r, t) {
		return r(this.value);
	}
};
var e = class extends r {
	constructor(r) {
		super(), this.error = void 0, this.isOk = !1, this.isErr = !0, this.error = r;
	}
	_chain(r, t) {
		return t(this.error);
	}
};
var n;
(function(r) {
	r.ok = function(r) {
		return new t(r);
	}, r.err = function(r) {
		return new e(r || /* @__PURE__ */ new Error());
	}, r.all = function(t) {
		if (Array.isArray(t)) {
			const e = [];
			for (let r = 0; r < t.length; r++) {
				const n = t[r];
				if (n.isErr) return n;
				e.push(n.value);
			}
			return r.ok(e);
		}
		const e = {}, n = Object.keys(t);
		for (let r = 0; r < n.length; r++) {
			const s = t[n[r]];
			if (s.isErr) return s;
			e[n[r]] = s.value;
		}
		return r.ok(e);
	};
})(n || (n = {}));
//#endregion
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/squareSet.js
var popcnt32 = (n) => {
	n = n - (n >>> 1 & 1431655765);
	n = (n & 858993459) + (n >>> 2 & 858993459);
	return Math.imul(n + (n >>> 4) & 252645135, 16843009) >> 24;
};
var bswap32 = (n) => {
	n = n >>> 8 & 16711935 | (n & 16711935) << 8;
	return n >>> 16 & 65535 | (n & 65535) << 16;
};
var rbit32 = (n) => {
	n = n >>> 1 & 1431655765 | (n & 1431655765) << 1;
	n = n >>> 2 & 858993459 | (n & 858993459) << 2;
	n = n >>> 4 & 252645135 | (n & 252645135) << 4;
	return bswap32(n);
};
/**
* An immutable set of squares, implemented as a bitboard.
*/
var SquareSet = class SquareSet {
	constructor(lo, hi) {
		this.lo = lo | 0;
		this.hi = hi | 0;
	}
	static fromSquare(square) {
		return square >= 32 ? new SquareSet(0, 1 << square - 32) : new SquareSet(1 << square, 0);
	}
	static fromRank(rank) {
		return new SquareSet(255, 0).shl64(8 * rank);
	}
	static fromFile(file) {
		return new SquareSet(16843009 << file, 16843009 << file);
	}
	static empty() {
		return new SquareSet(0, 0);
	}
	static full() {
		return new SquareSet(4294967295, 4294967295);
	}
	static corners() {
		return new SquareSet(129, 2164260864);
	}
	static center() {
		return new SquareSet(402653184, 24);
	}
	static backranks() {
		return new SquareSet(255, 4278190080);
	}
	static backrank(color) {
		return color === "white" ? new SquareSet(255, 0) : new SquareSet(0, 4278190080);
	}
	static lightSquares() {
		return new SquareSet(1437226410, 1437226410);
	}
	static darkSquares() {
		return new SquareSet(2857740885, 2857740885);
	}
	complement() {
		return new SquareSet(~this.lo, ~this.hi);
	}
	xor(other) {
		return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
	}
	union(other) {
		return new SquareSet(this.lo | other.lo, this.hi | other.hi);
	}
	intersect(other) {
		return new SquareSet(this.lo & other.lo, this.hi & other.hi);
	}
	diff(other) {
		return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
	}
	intersects(other) {
		return this.intersect(other).nonEmpty();
	}
	isDisjoint(other) {
		return this.intersect(other).isEmpty();
	}
	supersetOf(other) {
		return other.diff(this).isEmpty();
	}
	subsetOf(other) {
		return this.diff(other).isEmpty();
	}
	shr64(shift) {
		if (shift >= 64) return SquareSet.empty();
		if (shift >= 32) return new SquareSet(this.hi >>> shift - 32, 0);
		if (shift > 0) return new SquareSet(this.lo >>> shift ^ this.hi << 32 - shift, this.hi >>> shift);
		return this;
	}
	shl64(shift) {
		if (shift >= 64) return SquareSet.empty();
		if (shift >= 32) return new SquareSet(0, this.lo << shift - 32);
		if (shift > 0) return new SquareSet(this.lo << shift, this.hi << shift ^ this.lo >>> 32 - shift);
		return this;
	}
	bswap64() {
		return new SquareSet(bswap32(this.hi), bswap32(this.lo));
	}
	rbit64() {
		return new SquareSet(rbit32(this.hi), rbit32(this.lo));
	}
	minus64(other) {
		const lo = this.lo - other.lo;
		const c = (lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1) >>> 31;
		return new SquareSet(lo, this.hi - (other.hi + c));
	}
	equals(other) {
		return this.lo === other.lo && this.hi === other.hi;
	}
	size() {
		return popcnt32(this.lo) + popcnt32(this.hi);
	}
	isEmpty() {
		return this.lo === 0 && this.hi === 0;
	}
	nonEmpty() {
		return this.lo !== 0 || this.hi !== 0;
	}
	has(square) {
		return (square >= 32 ? this.hi & 1 << square - 32 : this.lo & 1 << square) !== 0;
	}
	set(square, on) {
		return on ? this.with(square) : this.without(square);
	}
	with(square) {
		return square >= 32 ? new SquareSet(this.lo, this.hi | 1 << square - 32) : new SquareSet(this.lo | 1 << square, this.hi);
	}
	without(square) {
		return square >= 32 ? new SquareSet(this.lo, this.hi & ~(1 << square - 32)) : new SquareSet(this.lo & ~(1 << square), this.hi);
	}
	toggle(square) {
		return square >= 32 ? new SquareSet(this.lo, this.hi ^ 1 << square - 32) : new SquareSet(this.lo ^ 1 << square, this.hi);
	}
	last() {
		if (this.hi !== 0) return 63 - Math.clz32(this.hi);
		if (this.lo !== 0) return 31 - Math.clz32(this.lo);
	}
	first() {
		if (this.lo !== 0) return 31 - Math.clz32(this.lo & -this.lo);
		if (this.hi !== 0) return 63 - Math.clz32(this.hi & -this.hi);
	}
	withoutFirst() {
		if (this.lo !== 0) return new SquareSet(this.lo & this.lo - 1, this.hi);
		return new SquareSet(0, this.hi & this.hi - 1);
	}
	moreThanOne() {
		return this.hi !== 0 && this.lo !== 0 || (this.lo & this.lo - 1) !== 0 || (this.hi & this.hi - 1) !== 0;
	}
	singleSquare() {
		return this.moreThanOne() ? void 0 : this.last();
	}
	*[Symbol.iterator]() {
		let lo = this.lo;
		let hi = this.hi;
		while (lo !== 0) {
			const idx = 31 - Math.clz32(lo & -lo);
			lo ^= 1 << idx;
			yield idx;
		}
		while (hi !== 0) {
			const idx = 31 - Math.clz32(hi & -hi);
			hi ^= 1 << idx;
			yield 32 + idx;
		}
	}
	*reversed() {
		let lo = this.lo;
		let hi = this.hi;
		while (hi !== 0) {
			const idx = 31 - Math.clz32(hi);
			hi ^= 1 << idx;
			yield 32 + idx;
		}
		while (lo !== 0) {
			const idx = 31 - Math.clz32(lo);
			lo ^= 1 << idx;
			yield idx;
		}
	}
};
//#endregion
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/board.js
/**
* Piece positions on a board.
*
* Properties are sets of squares, like `board.occupied` for all occupied
* squares, `board[color]` for all pieces of that color, and `board[role]`
* for all pieces of that role. When modifying the properties directly, take
* care to keep them consistent.
*/
var Board = class Board {
	constructor() {}
	static default() {
		const board = new Board();
		board.reset();
		return board;
	}
	/**
	* Resets all pieces to the default starting position for standard chess.
	*/
	reset() {
		this.occupied = new SquareSet(65535, 4294901760);
		this.promoted = SquareSet.empty();
		this.white = new SquareSet(65535, 0);
		this.black = new SquareSet(0, 4294901760);
		this.pawn = new SquareSet(65280, 16711680);
		this.knight = new SquareSet(66, 1107296256);
		this.bishop = new SquareSet(36, 603979776);
		this.rook = new SquareSet(129, 2164260864);
		this.queen = new SquareSet(8, 134217728);
		this.king = new SquareSet(16, 268435456);
	}
	static empty() {
		const board = new Board();
		board.clear();
		return board;
	}
	clear() {
		this.occupied = SquareSet.empty();
		this.promoted = SquareSet.empty();
		for (const color of COLORS) this[color] = SquareSet.empty();
		for (const role of ROLES) this[role] = SquareSet.empty();
	}
	clone() {
		const board = new Board();
		board.occupied = this.occupied;
		board.promoted = this.promoted;
		for (const color of COLORS) board[color] = this[color];
		for (const role of ROLES) board[role] = this[role];
		return board;
	}
	getColor(square) {
		if (this.white.has(square)) return "white";
		if (this.black.has(square)) return "black";
	}
	getRole(square) {
		for (const role of ROLES) if (this[role].has(square)) return role;
	}
	get(square) {
		const color = this.getColor(square);
		if (!color) return;
		return {
			color,
			role: this.getRole(square),
			promoted: this.promoted.has(square)
		};
	}
	/**
	* Removes and returns the piece from the given `square`, if any.
	*/
	take(square) {
		const piece = this.get(square);
		if (piece) {
			this.occupied = this.occupied.without(square);
			this[piece.color] = this[piece.color].without(square);
			this[piece.role] = this[piece.role].without(square);
			if (piece.promoted) this.promoted = this.promoted.without(square);
		}
		return piece;
	}
	/**
	* Put `piece` onto `square`, potentially replacing an existing piece.
	* Returns the existing piece, if any.
	*/
	set(square, piece) {
		const old = this.take(square);
		this.occupied = this.occupied.with(square);
		this[piece.color] = this[piece.color].with(square);
		this[piece.role] = this[piece.role].with(square);
		if (piece.promoted) this.promoted = this.promoted.with(square);
		return old;
	}
	has(square) {
		return this.occupied.has(square);
	}
	*[Symbol.iterator]() {
		for (const square of this.occupied) yield [square, this.get(square)];
	}
	pieces(color, role) {
		return this[color].intersect(this[role]);
	}
	rooksAndQueens() {
		return this.rook.union(this.queen);
	}
	bishopsAndQueens() {
		return this.bishop.union(this.queen);
	}
	/**
	* Finds the unique king of the given `color`, if any.
	*/
	kingOf(color) {
		return this.pieces(color, "king").singleSquare();
	}
};
var boardEquals = (left, right) => left.white.equals(right.white) && left.promoted.equals(right.promoted) && ROLES.every((role) => left[role].equals(right[role]));
//#endregion
export { n as i, boardEquals as n, SquareSet as r, Board as t };

//# sourceMappingURL=board-cv2zIgd0.js.map