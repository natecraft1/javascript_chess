var Board = (function() {
function Board() {
	var i, len;
	var that = this;
	this.trn = "white";
	this.knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,2], [2,1], [1,-2], [2,-1]];
	this.check = { "white": false, "black": false, "whiteEscapes": [], "blackEscapes": [] };
	this.checkPaths = { "white": [], "black": [], "whitePathHolder": [], "blackPathHolder": []};
	this.immobile = {"white": null, "black": null};
	this.board = document.getElementById("board");
	this.rows = document.getElementsByTagName("tr"); 
	for (i = 0, len = this.rows.length; i < len; i++) {
		this.setSquares(this.rows[i], i);
	}
	this.board.onclick = function(e) {
		var clicked = e.target, target, targetEl, valid, piece, clearOfCheck;
		if (clicked.tagName == "TD") {
			targetEl = clicked;
			target = clicked.className.split(" ")[0];
		} else if (clicked.tagName == "IMG") {
			targetEl = clicked.parentNode;
			target = targetEl.className.split(" ")[0];
		}
		piece = that.positions[that.selected];
		if (that.pieceOfSameColor(target, that.trn)) {
			// selecting same color piece
			if (that.selected && that.selected != target) {
				// remove selected class from previously selected 
				that.selectedEl.className = that.selectedEl.className.replace("selected", "");
				that.newSelection(target, targetEl);
			} else {
				that.newSelection(target, targetEl);
			}
		} else if (that.selected) {

			that.justCastled = false;
			// make sure we are not moving from a path being the only thing in the way of the king
			var path = that.checkOppPaths(that.selected, target, piece.color);

			if (piece.type == "king") {
				var kingEnteringCheckPath = that.possibleKingMove([target], piece.moves, piece.color).length == 0;
			}

			clearOfCheck = that.clearOfCheck(piece, target);

			if (clearOfCheck && path && !kingEnteringCheckPath
				&& that.validMove(piece, that.selected, target)
			) {
				that.movedPathHolder(that.swap(piece.color));
				
				if (that.pawnPromotion(piece, target)) {
					that.promote(piece.color, target, targetEl);
				} else {
					if (!that.justCastled) that.movePiece(target, targetEl);
					if (piece.type == "king") {
						that.kingMoved(target, piece.color);
						that.kings[piece.color] = target;
					} else {
						that.setCheck(piece, target, that.selected);
					}
					that.turn(that.trn);
				}
				console.log(that.checkPaths);
				// if you make a valid move, and it's into one of the opps' path sqs
			}
		} 
	}	
}
	Board.prototype.pawnPromotion = function(piece, target) {
		return piece.type == "pawn" 
				&& piece.color == "white" && target[0] == "0" 
				|| piece.color == "black" && target[0] == "7";
	}
	Board.prototype.movedPathHolder = function(color) {
		var path = this.checkPaths[color + "PathHolder"].indexOf(this.selected);
		if (path != -1) { this.changePathHolder(color, path) };
	}
	Board.prototype.clearOfCheck = function(piece, target) {
		if (!this.check[piece.color]) {
			return true;
		} else {
			if (this.validMoveInCheck(piece, target)) {
				return true;
			} else { 
				return false; 
			}
		}
	}
	Board.prototype.newSelection = function(target, targetEl) {
		this.selected = target;
		this.selectedEl = targetEl;
		targetEl.className += " selected";
	}
	Board.prototype.pieceOfSameColor = function(target, color) {
		return this.positions[target] && this.positions[target].color == color;
	}
	Board.prototype.turn = function(color) {
		if (color == "white") {
			this.trn = "black";
		} else {
			this.trn = "white";
		} 
	}
	Board.prototype.promote = function(color, sq, targetEl) {
		console.log("PROMOTE CALLED");
		var modal = document.getElementById("promotion_" + color);
		var that = this;
		modal.style.visibility = "visible";
		var colorInd = color == "white" ? 0 : 1;
		modal.onclick = function(e) {
			modal.style.visibility = "hidden";
			var p = that.pieces[e.target.getAttribute("data-piece")];
			// we do this because movePiece is going to copy this img
			that.selectedEl.children[0].src = p.srcs[colorInd];
			pProperties = {"type": p.type, "square": sq, "color": color, "src": p.srcs[colorInd]};
			var newPiece = new Piece(pProperties);
			that.positions[this.selected] = newPiece;
			if (!that.justCastled) that.movePiece(sq, targetEl);
		}
	}
	Board.prototype.kingMoved = function(sq, color) {
		this.checkPaths[color + "PathHolder"] = [];
		this.checkPaths[color] = [];
		this.immobile[color] = null;
		this.check[color + "Escapes"] = [];
		this.check[color] = false;
		var i, len, direction, d1, d2, next, potentialPath;
		var moves = this.positions[sq].moves;
    var f =	+sq[0], s = +sq[1];

		for (i = 0, len = moves.length; i < len; i++) {
			ff = f, ss = s;
			direction = moves[i];
			potentialPath = [];
			d1 = direction[0], d2 = direction[1];
			while (ff+d1 <= 7 && ff+d1 >= 0 && ss+d2 <= 7 && ss+d2 >= 0) {
				ff += d1;
				ss += d2;
				next = ff + "" + ss;
				if (this.positions[next]
					&& this.positions[next].color != color
					&& this.positions[next].multiples
					&& this.hasMove(this.positions[next].moves, JSON.stringify(direction))) {
					this.checkPaths[color].push(potentialPath);
					this.checkPaths[color + "PathHolder"].push(next);
					break;
				} else if (this.positions[next]
					&& this.positions[next].color != color 
					&& !this.positions[next].multiples) {
					break;
				} else {
					potentialPath.push(next);
				}
			}
		}
	}
	Board.prototype.changePathHolder = function(color, index) {
		this.checkPaths[color].splice(index, 1);
		this.checkPaths[color + "PathHolder"].splice(index, 1);
	}
	Board.prototype.mobilize = function(color, to) {
		// if another piece moves into the path, there is no immobile piece
		// not sure if this method is even necessary
		var path = this.checkPaths[color];
		for (var i = 0; i < path.length; i++) {
			if (path[i].indexOf(to) != -1 || this.checkPaths[color + "PathHolder"] == to) {
				this.immobile[color] == null;
			} 
		}

		if (this.checkPaths[color].indexOf(to) != -1 
			|| this.checkPaths[color + "PathHolder"] == to) {
			this.immobile[color] = null;
		}
	}
	Board.prototype.setCheck = function(piece, newSq, prevSq) {
		// are they in check?
		if (this.check[piece.color]) {
			this.resetCheckProperties(piece, newSq, prevSq);
			return;
		}
		var opponent = this.trn == "white" ? "black" : "white";
		var oppInCheck = this.check[opponent];
		var type = piece.type;
		var distFromKing, pathBlocked, oppKingSq =	this.kings[opponent];
		
		if (type == "pawn" || type == "knight") {
			var checkMoves = type == "pawn" ? piece.eat : piece.moves;
			var potentialChecks = (function() {
				var i, d1, d2, len, arr = [];
				for (i = 0, len = checkMoves.length; i < len; i++) {
					d1 = +newSq[0] + checkMoves[i][0];
					d2 = +newSq[1] + checkMoves[i][1];
					arr.push(d1 + "" + d2);
				}
				return arr;
			})();
// POTENTIAL REFACTOR BC THIS LOGIC IS BEING REPEATED IN THE ELSE STATEMENT AS WELL 
			var check = potentialChecks.indexOf(oppKingSq) == -1 ? false : true;
			this.check[opponent] = check; 
			if (this.check[opponent]) { 
				this.checkPaths[opponent + "PathHolder"].push(newSq);
				if (!this.checkMate(opponent, newSq)) {

				} else {
					this.gameOver();
				}
			}
		} else {
			// not a knight or pawn
			// first check if it's possible
			distFromKing = [+oppKingSq[0] - +newSq[0], +oppKingSq[1] - + newSq[1]];
			if (this.validDirection(distFromKing)) {
				// it's possible that the opp is in check
				// if it's not impeded opp is in check
				if (piece.multiples) {
					pathBlocked = this.pathBlocked(piece, distFromKing, JSON.stringify(distFromKing), newSq, opponent);
				}
				this.check[opponent] = !pathBlocked;
				if (!pathBlocked) { 
					if (!this.checkMate(opponent, newSq, distFromKing)) {
					} else {
						this.gameOver();
					}
				}
			}
		}
	}
	Board.prototype.gameOver = function() {
		console.log("gg");
	}
	Board.prototype.checkOppPaths = function(from, to, color) {
		var paths = this.checkPaths[color];
		var pathInd = this.checkPathIndex(from, color);
		var path = paths[pathInd];
		var pathholder = this.checkPaths[color + "PathHolder"];
		var blockers = [];
		var king = this.positions[from].type == "king";
		if (pathInd != -1) {
			// are we trying to move from or to the path?
			// if we're trying to eat the pathholder, we'll let validmove handle it
			// COME BACK TO HERE
			if (pathholder.indexOf(to) != -1 || this.checkPathIndex(to, color) != -1 
				&& !king) { 
				return true; 
			}
			// allowed if there's another piece in the path - pathholder 
			for (i = 0, lngth = path.length; i < lngth; i++) {
				// check if there's another piece in the path that isn't the offending piece, or the piece we started with
				if (this.positions[path[i]] 
					// i don't think paths[i] can equal pathholder
					&& path[i] != pathholder
					&& path[i] != from) {
					blockers.push(path[i]);
				}
			}
			// didnt find something else in the path;
			// we return false because you can't move from a sq if it will put u in check
			if (blockers.length >= 1) {
				return true;
			} else {
				return false;
			}
		}
		return true;
	}
	Board.prototype.checkMate = function(opponent, attackingSq, distFromKing) {
		var i, len, sq;
		var oppKingSq = this.kings[opponent];
		var oppKing = this.positions[oppKingSq];
		var possibleKingMoves = [];
		var surroundingSqs = (function() {
			var arr = [];
			var i, len, f, s, combined;
			for (i = 0, len = oppKing.moves.length; i<len; i++) {
				f = +oppKingSq[0] + oppKing.moves[i][0];
				s = +oppKingSq[1] + oppKing.moves[i][1];
			  combined = f + "" + s;
			  if (combined in this.positions) {
			  	arr.push(combined);
			  }
			}
			return arr;
		}).call(this);
		for (i = 0, len = surroundingSqs.length; i < len; i++) {
			sq = surroundingSqs[i];
			if (!this.positions[sq] || this.positions[sq].color !== opponent) {
				possibleKingMoves.push(sq);
			} 
		}
		var kingMoves = this.possibleKingMove(possibleKingMoves, oppKing.moves, opponent);
		if (kingMoves.length > 0) {
			this.check[opponent + "Escapes"] = kingMoves;
			return false;
		} else if (this.canBeSaved(opponent, attackingSq)) {
			return false;
		} else { return true; }

	}
	Board.prototype.swap = function(color) {
		return color == "white" ? "black" : "white";
	}
	Board.prototype.canBeSaved = function(color, attackingSq) {
		// here we check if ANY of the opps pieces can move to one of our checkPath sqs
		var i, p, lth, len, dist, direction, j, lngth, moves, moveTo, piece, l, z, pFirstMove, pEatMove, pForwardMove;
		var pathInd = this.checkPathIndex(attackingSq, color);
		var resqueSqs = pathInd == -1 ? [attackingSq] : this.checkPaths[color][pathInd].slice(0).push(attackingSq);

		for (var sqr in this.positions) {
			piece = this.positions[sqr];
			if (piece && piece.color == color) {
				if (piece.multiples) {
					for (i = 0, len = resqueSqs.length; i < len; i++) {
						dist = this.distBtwnSqs(sqr, resqueSqs[i]);

						if (this.validDirection(dist)) {
							direction = this.validPieceDirection(piece, Math.abs(dist[0]), Math.abs(dist[1]), JSON.stringify(dist));
							if (direction) {
								if (this.clearPath(sqr, Math.abs(dist[0]), Math.abs(dist[1]), direction)) {
									return true;
								}
							}
						}
					}
				} else if (piece.type == "knight") {
					moves = piece.moves;
					for (j = 0, lngth = moves.length; j < lngth; j++) {
						moveTo = (+sqr[0] + moves[j][0]) + "" + (+sqr[1] + moves[j][1]);
						if (resqueSqs.indexOf(moveTo) != -1) {
							return true;
						}
					}
				} else {
					// we're a pawn
					for (l = 0; l < piece.eat.length; l++) {
						pEatMove = (+sqr[0] + piece.eat[l][0]) + "" + (+sqr[1] + piece.eat[l][1]);
						if (this.checkPaths[color + "PathHolder"][pathInd] == pEatMove) {
							return true;
						}
					}
					if (this.pawnLegalMoves(sqr, piece.firstMoves[0], color)) {
						return true;
					}
					if (!piece.moved) {
						if (this.pawnLegalMoves(sqr, piece.firstMoves[1], color)) {
							return true;
						}
					} 
				}
			}
		}
		return false;
	}
	Board.prototype.pawnLegalMoves = function(sqr, move, color) {
		var mv;
		mv = (+sqr[0] + move[0]) + "" + (+sqr[1] + move[1]);
		if (this.checkPathIndex(sqr, color) != -1) {
			return true;
		} 
	}
	Board.prototype.distBtwnSqs = function(from, to) {
		// takes 2 sqs and returns an array of the shift we're trying to make
		return [+to[0] - +from[0], +to[1] - +from[1]]
	}

	Board.prototype.possibleKingMove = function(sqs, moves, color, castling) {
console.log('possibleKingMove called with', sqs, moves, color);
		var i, len, k, lenth, knt, j, lngth, p, f, ff, s, ss, next, path, strMove, potentialPawnMove, pawnMoves;
		var validMoves = [];

		// we have to walk all directions until we hit one of our own, an opponent, or to the end of the board
		allSqs: for (i = 0, len = sqs.length; i < len; i++) {
			f = +sqs[i][0], s = +sqs[i][1];
			// check for knights
			for (k = 0, lenth = this.knightMoves.length; k < lenth; k++) {
				knt = (f + this.knightMoves[k][0]) + "" + (s + this.knightMoves[k][1]); 
				if (this.positions[knt] 
					&& this.positions[knt].type == "knight" 
					&& this.positions[knt].color != color) {
					// don't push
					continue allSqs;
				}
			}
			// check for pawns
			for (p = 0; p < 2; p++) {
				if (color == "black") {
					pawnMoves = [[-1, -1], [-1, 1]];
				} else if (color == "white") {
					pawnMoves = [[1, -1], [1, 1]];
				}
				potentialPawnMove = (f + pawnMoves[p][0]) + "" + (s + pawnMoves[p][1]);
				if (this.positions[potentialPawnMove] 
					&& this.positions[potentialPawnMove].type == "pawn"
					&& this.positions[potentialPawnMove].color != color) {
					// don't push
					if (!castling) { 
						continue allSqs;
					}
				}
			}
			allMoves:	for (j = 0, lngth = moves.length; j < lngth; j++) {
				// conditions for break:
				strMove = JSON.stringify(moves[j]);
				ff = f, ss = s;
				// we reach the end of the board
				while (ff+moves[j][0] <= 7 && ff+moves[j][0] >= 0 && ss+moves[j][1] <= 7 && ss+moves[j][1] >= 0) {
					ff += moves[j][0];
					ss += moves[j][1];
					next = ff + "" + ss;
					if (this.positions[next]) {
						if (this.positions[next].color == color) {
							// we hit our own piece
							break;
						} else {
							if (JSON.stringify(this.positions[next].moves).indexOf(strMove) != -1) {
								continue allSqs;
								// we hit an opp piece that doesn't share the path
							} else { break; }
						}
					}
				}
			}
			// we found a free sq
			validMoves.push(sqs[i]);
		}					
		return validMoves;
	}
	Board.prototype.movePiece = function(target, targetEl) {
		// we want to remove the selectedEl, 
		// moves the elements
		var html = this.selectedEl.innerHTML;
		this.selectedEl.innerHTML = ""; 
		targetEl.innerHTML = html;
		// remove selected class
		this.selectedEl.className = this.selectedEl.className.replace("selected", "");
		// update positions
		this.positions[target] = this.positions[this.selected];
		this.positions[this.selected] = null;
		// clear selected
		this.selected = null;
		this.selectedEl = null;
	}
	Board.prototype.validMoveInCheck = function(piece, to) {
		if (piece.type == "king") {
			if (this.check[piece.color + "Escapes"].indexOf(to) != -1) {
				this.check[piece.color] = false;
				return true;
			} else {
				return false;
			}
		} else {
			// the most recent pathholder is the one that put us in check
			var pathHolders = this.checkPaths[piece.color + "PathHolder"];
			var checkHolder = pathHolders[pathHolders.length-1];
			if (this.checkPathIndex(to, piece.color) == pathHolders.length-1
				|| checkHolder == to) {
				return true;
			} 
		}
	}
	Board.prototype.checkPathIndex = function(sq, color, pathholder) {
		var pathHolder;
		if (pathholder != undefined) {
			pathHolder = pathholder;
		} else { 
			pathHolder = "";
		}
		var path = this.checkPaths[color + pathHolder];
		var highestInd = -1, ind;
		for (var i = 0; i < path.length; i++) {
			if (pathHolder.length > 0) {
				ind = path[i] == sq ? i : -1;
			} else {
				ind = path[i].indexOf(sq) == -1 ? -1 : i;
			}
			if (ind > highestInd) highestInd = ind;
		}
		return highestInd;
	}
	Board.prototype.resetCheckProperties = function(piece, to, from) {	
		// you clear the path and pathholder IF the pathholder is eaten or the king moves
		// both if king moves
		var pathHolderInd = this.checkPathIndex(to, piece.color, "PathHolder");
		if (pathHolderInd != -1) {
			this.checkPaths[piece.color + "PathHolder"].splice(pathHolderInd, 1);
			this.checkPaths[piece.color].splice(pathHolderInd, 1);
		} else if (this.check[piece.color + "Escapes"].indexOf(to) != -1) {
			this.checkPaths[piece.color + "PathHolder"] = [];
			this.checkPaths[piece.color] = [];
		} else {
console.log("MOVED INTO THE PATH");
		}

		this.check[piece.color + "Escapes"] = [];
		this.check[piece.color] = false;
	
	}
	Board.prototype.hasMove = function(moves, move) {
		return JSON.stringify(moves).indexOf(move) != -1;
	}
		Board.prototype.validMove = function(piece, from, to) {
		// are we already in check??					
			var desiredShift = this.distBtwnSqs(from, to);
			var desiredStr = JSON.stringify(desiredShift);
			var spotTaken = !!this.positions[to];
			var diffColors = spotTaken && this.positions[to].color != piece.color;
			var cornerPiece, fromRow;
			if (piece.type == "pawn") {
				if (this.hasMove(piece.moves, desiredStr) && !spotTaken) {
					if (!piece.moved) piece.moved = true;
					return true;
		// are we trying to eat a piece?
				} else if (this.hasMove(piece.eat, desiredStr) && diffColors) {
						if (!piece.moved) piece.moved = true;
						return true;
		// if nothing is valid so far, maybe it's our first move
				} else if (!piece.moved && this.hasMove(piece.firstMoves, desiredStr)) {
		// here we still need to check, is something in the way?? bc we could be moving 2 spaces up and running into something
						piece.moved = true;
						return true;
				} else {
					return false;
				}			
			} else {
				// we are not a pawn
				// check if we're a king that's trying to castle 
				if (this.canAttemptToCastle(piece, desiredStr)) { 
					if (this.canCastle(desiredShift, piece, from, to)) {
						this.justCastled = true;
						return true;
					} else { return false; }
				}
			var r = Math.abs(desiredShift[0]);
			var c = Math.abs(desiredShift[1]);
			if (piece.multiples && (r > 1 || c > 1)) {
				// here we check if there's anything in our way
				var dir = this.validPieceDirection(piece, r, c, desiredStr);
				if (this.validDirection(desiredShift) 
					&& dir
					&& this.clearPath(from, r, c, dir)) {
					return true;
				} else {
					return false;
				}
			} else {
				// not trying to move multiple squares
				if (this.hasMove(piece.moves, desiredStr) && (diffColors || !spotTaken)) {
					return true;
				} else { return false; }
			}
			}
		}
		Board.prototype.canAttemptToCastle = function(piece, desiredStr) {
			return piece.type == "king" 
					&& !piece.moved
					&& this.hasMove(piece.castleMoves, desiredStr);
		}
		Board.prototype.canCastle = function(desiredShift, piece, from, to) {
			var emptySqs, cornerPiece, pathsClear;
			var that = this;
			var fromRow = from[0];
			if (desiredShift[1] < 0) {
				// trying to castle left
				cornerPiece = this.positions[fromRow + 0];
				emptySqs = [fromRow + 1, fromRow + 2, fromRow + 3].filter(function(x) {
					return !that.positions[x];
				});
				pathsClear = this.possibleKingMove(emptySqs.slice(0), piece.moves, piece.color, true);
				if (cornerPiece.type == "rook" 
					&& !cornerPiece.moved
					&& pathsClear.length == 3
					&& emptySqs.length == 3) {
					this.castle(piece,from,to,cornerPiece,fromRow+0,fromRow+3);
					return true;
				} else { return false; }
			} else {
				// trying to castle right
				cornerPiece = this.positions[fromRow + 7];
				emptySqs = [fromRow + 6, fromRow + 5].filter(function(x) {
					return !that.positions[x];
				});
				pathsClear = this.possibleKingMove(emptySqs.slice(0), piece.moves, piece.color, true);
// WHY IS THIS RETURNING 2???
				if (cornerPiece.type == "rook"
					&& !cornerPiece.moved
					&& pathsClear.length == 2
					&& emptySqs.length == 2) {
					this.castle(piece,from,to,cornerPiece,fromRow+7,fromRow+5);
					return true;
				}  else { return false; }
			}
			// if we can't return false;
			return false;
		}
		Board.prototype.castle = function(king, kFrom, kTo, rook, rFrom, rTo) {
			this.kings[king.color] = kTo;
		king.moved = true;
		rook.moved = true;
			var kingHTML = this.selectedEl.innerHTML;
			var rookEl = document.getElementsByClassName(rFrom)[0];
			var rookHTML = rookEl.innerHTML;
			var kToEl = document.getElementsByClassName(kTo)[0];
			var rToEl = document.getElementsByClassName(rTo)[0];
			this.selectedEl.innerHTML = "";
			rookEl.innerHTML = "";
			kToEl.innerHTML = kingHTML;
			rToEl.innerHTML = rookHTML;
			this.selectedEl.className = this.selectedEl.className.replace("selected", "");
			// update positions
			this.positions[kTo] = this.positions[kFrom];
			this.positions[kFrom] = null;
			this.positions[rTo] = this.positions[rFrom];
			this.positions[rFrom] = null;
			// clear selected
			this.selected = null;
			this.selectedEl = null;
		}
		Board.prototype.validDirection = function(desiredShift) {
			var r, c;
			r = Math.abs(desiredShift[0]), c = Math.abs(desiredShift[1]);
			// is it a legal attempt?
			var zeroIndex = desiredShift.indexOf(0);
		if (zeroIndex == -1 && r != c) {
			return false;
		} else { return true };

		}
		Board.prototype.validPieceDirection = function(piece, r, c, desiredStr) {
		var zero = [r,c].indexOf(0);
		for (i = 0, len = piece.moves.length; i < len; i++) {
			// run it if there is no zero, or if zeros 
			if (zero == -1 || piece.moves[i][zero] == 0) {
				if (JSON.stringify([piece.moves[i][0] * r, piece.moves[i][1] * c]) == desiredStr) {
					return piece.moves[i];
				}
			}
		}
		}
		Board.prototype.clearPath = function(from, r, c, direction) {
			var startArr = [+from[0],+from[1]];
			var j;
		for (j = 0; j < (Math.max(r,c)-1); j++) {
// this seems sketchy to update startArr (contender for refactor)
			startArr[0] = startArr[0] + direction[0];
			startArr[1] = startArr[1] + direction[1];
			inBtwnSq = startArr[0] + "" + startArr[1];
			if (this.positions[inBtwnSq]) {
				return false;
			}
		}
		return true;
		}
		Board.prototype.pathBlocked = function(piece, desiredShift, desiredStr, from, opponent) {

			// var opponent = this.trn == "white" ? "black" : "white";
			var non_zero, direction, inBtwnSq, r, c, i, j, len, startArr, inBtwnSqs;
			var blockers = [];
		// 	r = Math.abs(desiredShift[0]), c = Math.abs(desiredShift[1]);
			startArr = [+from[0],+from[1]];
			r = Math.abs(desiredShift[0]), c = Math.abs(desiredShift[1]);

		// does one of our available moves match the desired move?
		var validPD = this.validPieceDirection(piece, r, c, desiredStr);
			if (validPD) {
			direction = validPD;
			inBtwnSqs = [];
			// are there any of our pieces in the way?
			for (j = 0; j < (Math.max(r,c)-1); j++) {
// this seems sketchy to update startArr (contender for refactor)
				startArr[0] = startArr[0] + direction[0];
				startArr[1] = startArr[1] + direction[1];
				inBtwnSq = startArr[0] + "" + startArr[1];
				inBtwnSqs.push(inBtwnSq);
				if (this.positions[inBtwnSq]) blockers.push(inBtwnSq);
			}
			// save them in the check path
			if (opponent) { 
				this.checkPaths[opponent].push(inBtwnSqs); 
				this.checkPaths[opponent + "PathHolder"].push(from);
			}
			// this means we checked all the squares and there was nothing
			return blockers.length > 0 ? blockers : false;
			} else {
				return true;
			}
		}

	Board.prototype.setSquares = function(row, index) {
		var i, len, color;
		var cols = row.getElementsByTagName("td");
		for (i = 0, len = cols.length; i < len; i++) {
			color = (i + index) % 2 == 0 ? "even" : "odd";
			cols[i].setAttribute("class", index + "" + i + " " + color);
		}
	}
	Board.prototype.set = function(positions) {
		var i, len, piece, sq;
		var positionKeys = Object.keys(positions);
		for (i = 0, len = positionKeys.length; i < len; i++) {
			piece = positions[positionKeys[i]];
			if (piece) {
				sq = document.getElementsByClassName(piece.starting_position)[0];
				var img = document.createElement("img");
				img.src = piece.src;
				sq.appendChild(img);
			}
		}
	}
	return Board;
})();