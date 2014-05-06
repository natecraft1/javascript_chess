var Piece = (function() {
	function Piece(props) {
		this.type = props.type;
		this.starting_position = props.square;
		this.color = props.color;
		this.src = props.src;
		this.legalMoves(); 
	}
	Piece.prototype.legalMoves = function() {
		switch (this.type) {
			case "pawn":
				if (this.color == "white") {
					this.moves = [[-1,0]];
					this.eat = [[-1,-1],[-1,1]];
					this.firstMoves = [[-1,0], [-2,0]];
				} else {
					this.moves = [[1,0]];
					this.eat = [[1,1], [1,-1]];
					this.firstMoves = [[1,0], [2,0]];
				}
				this.moved = false;
				this.multiples = false;
				break;
			case "rook": 
			  this.moves = [[-1,0], [1,0], [0,-1], [0,1]];
			  this.multiples = true;
			  this.moved = false;
			  break;
			case "knight":
			  this.moves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,2], [2,1], [1,-2], [2,-1]];
			  this.multiples = false;
			  break;
			case "queen":
				this.moves = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,1], [1,-1]];
				this.multiples = true;
				break;
			case "king": 
				this.castleMoves = [[0,-2], [0,2]];
				this.moves = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,1], [1,-1]];
				this.multiples = true;
				this.moved = false;
				break;
			case "bishop":
			  this.moves = [[1,1], [-1,-1], [-1,1], [1,-1]];
			  this.multiples = true;
			  break;
		}
	}
	return Piece;
})();