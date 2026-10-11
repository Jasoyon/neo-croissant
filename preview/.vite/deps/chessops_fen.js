import { i as n, r as SquareSet, t as Board } from "./board-cv2zIgd0.js";
import { _ as FILE_NAMES, c as parseSquare, f as squareFile, g as COLORS, i as makeSquare, n as defined, p as squareFromCoords, t as charToRole, u as roleToChar, v as ROLES } from "./util-Ba4iPLSj.js";
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/setup.js
var MaterialSide = class MaterialSide {
	constructor() {}
	static empty() {
		const m = new MaterialSide();
		for (const role of ROLES) m[role] = 0;
		return m;
	}
	static fromBoard(board, color) {
		const m = new MaterialSide();
		for (const role of ROLES) m[role] = board.pieces(color, role).size();
		return m;
	}
	clone() {
		const m = new MaterialSide();
		for (const role of ROLES) m[role] = this[role];
		return m;
	}
	equals(other) {
		return ROLES.every((role) => this[role] === other[role]);
	}
	add(other) {
		const m = new MaterialSide();
		for (const role of ROLES) m[role] = this[role] + other[role];
		return m;
	}
	subtract(other) {
		const m = new MaterialSide();
		for (const role of ROLES) m[role] = this[role] - other[role];
		return m;
	}
	nonEmpty() {
		return ROLES.some((role) => this[role] > 0);
	}
	isEmpty() {
		return !this.nonEmpty();
	}
	hasPawns() {
		return this.pawn > 0;
	}
	hasNonPawns() {
		return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
	}
	size() {
		return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
	}
};
var Material = class Material {
	constructor(white, black) {
		this.white = white;
		this.black = black;
	}
	static empty() {
		return new Material(MaterialSide.empty(), MaterialSide.empty());
	}
	static fromBoard(board) {
		return new Material(MaterialSide.fromBoard(board, "white"), MaterialSide.fromBoard(board, "black"));
	}
	clone() {
		return new Material(this.white.clone(), this.black.clone());
	}
	equals(other) {
		return this.white.equals(other.white) && this.black.equals(other.black);
	}
	add(other) {
		return new Material(this.white.add(other.white), this.black.add(other.black));
	}
	subtract(other) {
		return new Material(this.white.subtract(other.white), this.black.subtract(other.black));
	}
	count(role) {
		return this.white[role] + this.black[role];
	}
	size() {
		return this.white.size() + this.black.size();
	}
	isEmpty() {
		return this.white.isEmpty() && this.black.isEmpty();
	}
	nonEmpty() {
		return !this.isEmpty();
	}
	hasPawns() {
		return this.white.hasPawns() || this.black.hasPawns();
	}
	hasNonPawns() {
		return this.white.hasNonPawns() || this.black.hasNonPawns();
	}
};
var RemainingChecks = class RemainingChecks {
	constructor(white, black) {
		this.white = white;
		this.black = black;
	}
	static default() {
		return new RemainingChecks(3, 3);
	}
	clone() {
		return new RemainingChecks(this.white, this.black);
	}
	equals(other) {
		return this.white === other.white && this.black === other.black;
	}
};
//#endregion
//#region ../en-croissant/node_modules/.pnpm/chessops@0.14.0/node_modules/chessops/dist/esm/fen.js
var INITIAL_BOARD_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
var INITIAL_EPD = INITIAL_BOARD_FEN + " w KQkq -";
var INITIAL_FEN = INITIAL_EPD + " 0 1";
var EMPTY_BOARD_FEN = "8/8/8/8/8/8/8/8";
var EMPTY_EPD = EMPTY_BOARD_FEN + " w - -";
var EMPTY_FEN = EMPTY_EPD + " 0 1";
var InvalidFen;
(function(InvalidFen) {
	InvalidFen["Fen"] = "ERR_FEN";
	InvalidFen["Board"] = "ERR_BOARD";
	InvalidFen["Pockets"] = "ERR_POCKETS";
	InvalidFen["Turn"] = "ERR_TURN";
	InvalidFen["Castling"] = "ERR_CASTLING";
	InvalidFen["EpSquare"] = "ERR_EP_SQUARE";
	InvalidFen["RemainingChecks"] = "ERR_REMAINING_CHECKS";
	InvalidFen["Halfmoves"] = "ERR_HALFMOVES";
	InvalidFen["Fullmoves"] = "ERR_FULLMOVES";
})(InvalidFen || (InvalidFen = {}));
var FenError = class extends Error {};
var nthIndexOf = (haystack, needle, n) => {
	let index = haystack.indexOf(needle);
	while (n-- > 0) {
		if (index === -1) break;
		index = haystack.indexOf(needle, index + needle.length);
	}
	return index;
};
var parseSmallUint = (str) => /^\d{1,4}$/.test(str) ? parseInt(str, 10) : void 0;
var charToPiece = (ch) => {
	const role = charToRole(ch);
	return role && {
		role,
		color: ch.toLowerCase() === ch ? "black" : "white"
	};
};
var parseBoardFen = (boardPart) => {
	const board = Board.empty();
	let rank = 7;
	let file = 0;
	for (let i = 0; i < boardPart.length; i++) {
		const c = boardPart[i];
		if (c === "/" && file === 8) {
			file = 0;
			rank--;
		} else {
			const step = parseInt(c, 10);
			if (step > 0) file += step;
			else {
				if (file >= 8 || rank < 0) return n.err(new FenError(InvalidFen.Board));
				const square = file + rank * 8;
				const piece = charToPiece(c);
				if (!piece) return n.err(new FenError(InvalidFen.Board));
				if (boardPart[i + 1] === "~") {
					piece.promoted = true;
					i++;
				}
				board.set(square, piece);
				file++;
			}
		}
	}
	if (rank !== 0 || file !== 8) return n.err(new FenError(InvalidFen.Board));
	return n.ok(board);
};
var parsePockets = (pocketPart) => {
	if (pocketPart.length > 64) return n.err(new FenError(InvalidFen.Pockets));
	const pockets = Material.empty();
	for (const c of pocketPart) {
		const piece = charToPiece(c);
		if (!piece) return n.err(new FenError(InvalidFen.Pockets));
		pockets[piece.color][piece.role]++;
	}
	return n.ok(pockets);
};
var parseCastlingFen = (board, castlingPart) => {
	let castlingRights = SquareSet.empty();
	if (castlingPart === "-") return n.ok(castlingRights);
	for (const c of castlingPart) {
		const lower = c.toLowerCase();
		const color = c === lower ? "black" : "white";
		const rank = color === "white" ? 0 : 7;
		if ("a" <= lower && lower <= "h") castlingRights = castlingRights.with(squareFromCoords(lower.charCodeAt(0) - "a".charCodeAt(0), rank));
		else if (lower === "k" || lower === "q") {
			const rooksAndKings = board[color].intersect(SquareSet.backrank(color)).intersect(board.rook.union(board.king));
			const candidate = lower === "k" ? rooksAndKings.last() : rooksAndKings.first();
			castlingRights = castlingRights.with(defined(candidate) && board.rook.has(candidate) ? candidate : squareFromCoords(lower === "k" ? 7 : 0, rank));
		} else return n.err(new FenError(InvalidFen.Castling));
	}
	if (COLORS.some((color) => SquareSet.backrank(color).intersect(castlingRights).size() > 2)) return n.err(new FenError(InvalidFen.Castling));
	return n.ok(castlingRights);
};
var parseRemainingChecks = (part) => {
	const parts = part.split("+");
	if (parts.length === 3 && parts[0] === "") {
		const white = parseSmallUint(parts[1]);
		const black = parseSmallUint(parts[2]);
		if (!defined(white) || white > 3 || !defined(black) || black > 3) return n.err(new FenError(InvalidFen.RemainingChecks));
		return n.ok(new RemainingChecks(3 - white, 3 - black));
	} else if (parts.length === 2) {
		const white = parseSmallUint(parts[0]);
		const black = parseSmallUint(parts[1]);
		if (!defined(white) || white > 3 || !defined(black) || black > 3) return n.err(new FenError(InvalidFen.RemainingChecks));
		return n.ok(new RemainingChecks(white, black));
	} else return n.err(new FenError(InvalidFen.RemainingChecks));
};
var parseFen = (fen) => {
	const parts = fen.split(/[\s_]+/);
	const boardPart = parts.shift();
	let board;
	let pockets = n.ok(void 0);
	if (boardPart.endsWith("]")) {
		const pocketStart = boardPart.indexOf("[");
		if (pocketStart === -1) return n.err(new FenError(InvalidFen.Fen));
		board = parseBoardFen(boardPart.slice(0, pocketStart));
		pockets = parsePockets(boardPart.slice(pocketStart + 1, -1));
	} else {
		const pocketStart = nthIndexOf(boardPart, "/", 7);
		if (pocketStart === -1) board = parseBoardFen(boardPart);
		else {
			board = parseBoardFen(boardPart.slice(0, pocketStart));
			pockets = parsePockets(boardPart.slice(pocketStart + 1));
		}
	}
	let turn;
	const turnPart = parts.shift();
	if (!defined(turnPart) || turnPart === "w") turn = "white";
	else if (turnPart === "b") turn = "black";
	else return n.err(new FenError(InvalidFen.Turn));
	return board.chain((board) => {
		const castlingPart = parts.shift();
		const castlingRights = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : n.ok(SquareSet.empty());
		const epPart = parts.shift();
		let epSquare;
		if (defined(epPart) && epPart !== "-") {
			epSquare = parseSquare(epPart);
			if (!defined(epSquare)) return n.err(new FenError(InvalidFen.EpSquare));
		}
		let halfmovePart = parts.shift();
		let earlyRemainingChecks;
		if (defined(halfmovePart) && halfmovePart.includes("+")) {
			earlyRemainingChecks = parseRemainingChecks(halfmovePart);
			halfmovePart = parts.shift();
		}
		const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
		if (!defined(halfmoves)) return n.err(new FenError(InvalidFen.Halfmoves));
		const fullmovesPart = parts.shift();
		const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
		if (!defined(fullmoves)) return n.err(new FenError(InvalidFen.Fullmoves));
		const remainingChecksPart = parts.shift();
		let remainingChecks = n.ok(void 0);
		if (defined(remainingChecksPart)) {
			if (defined(earlyRemainingChecks)) return n.err(new FenError(InvalidFen.RemainingChecks));
			remainingChecks = parseRemainingChecks(remainingChecksPart);
		} else if (defined(earlyRemainingChecks)) remainingChecks = earlyRemainingChecks;
		if (parts.length > 0) return n.err(new FenError(InvalidFen.Fen));
		return pockets.chain((pockets) => castlingRights.chain((castlingRights) => remainingChecks.map((remainingChecks) => {
			return {
				board,
				pockets,
				turn,
				castlingRights,
				remainingChecks,
				epSquare,
				halfmoves,
				fullmoves: Math.max(1, fullmoves)
			};
		})));
	});
};
var parsePiece = (str) => {
	if (!str) return;
	const piece = charToPiece(str[0]);
	if (!piece) return;
	if (str.length === 2 && str[1] === "~") piece.promoted = true;
	else if (str.length > 1) return;
	return piece;
};
var makePiece = (piece) => {
	let r = roleToChar(piece.role);
	if (piece.color === "white") r = r.toUpperCase();
	if (piece.promoted) r += "~";
	return r;
};
var makeBoardFen = (board) => {
	let fen = "";
	let empty = 0;
	for (let rank = 7; rank >= 0; rank--) for (let file = 0; file < 8; file++) {
		const square = file + rank * 8;
		const piece = board.get(square);
		if (!piece) empty++;
		else {
			if (empty > 0) {
				fen += empty;
				empty = 0;
			}
			fen += makePiece(piece);
		}
		if (file === 7) {
			if (empty > 0) {
				fen += empty;
				empty = 0;
			}
			if (rank !== 0) fen += "/";
		}
	}
	return fen;
};
var makePocket = (material) => ROLES.map((role) => roleToChar(role).repeat(material[role])).join("");
var makePockets = (pocket) => makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
var makeCastlingFen = (board, castlingRights) => {
	let fen = "";
	for (const color of COLORS) {
		const backrank = SquareSet.backrank(color);
		let king = board.kingOf(color);
		if (defined(king) && !backrank.has(king)) king = void 0;
		const candidates = board.pieces(color, "rook").intersect(backrank);
		for (const rook of castlingRights.intersect(backrank).reversed()) if (rook === candidates.first() && defined(king) && rook < king) fen += color === "white" ? "Q" : "q";
		else if (rook === candidates.last() && defined(king) && king < rook) fen += color === "white" ? "K" : "k";
		else {
			const file = FILE_NAMES[squareFile(rook)];
			fen += color === "white" ? file.toUpperCase() : file;
		}
	}
	return fen || "-";
};
var makeRemainingChecks = (checks) => `${checks.white}+${checks.black}`;
var makeFen = (setup, opts) => [
	makeBoardFen(setup.board) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ""),
	setup.turn[0],
	makeCastlingFen(setup.board, setup.castlingRights),
	defined(setup.epSquare) ? makeSquare(setup.epSquare) : "-",
	...setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : [],
	...(opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]
].join(" ");
//#endregion
export { EMPTY_BOARD_FEN, EMPTY_EPD, EMPTY_FEN, FenError, INITIAL_BOARD_FEN, INITIAL_EPD, INITIAL_FEN, InvalidFen, makeBoardFen, makeCastlingFen, makeFen, makePiece, makePocket, makePockets, makeRemainingChecks, parseBoardFen, parseCastlingFen, parseFen, parsePiece, parsePockets, parseRemainingChecks };

//# sourceMappingURL=chessops_fen.js.map