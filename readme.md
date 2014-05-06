1. A game is created with a boardMatrix
2. The game is initialized
3. A new Board Object is created
4. The board is assigned piece types
5. The board is assigned positions
6. Board.kings = { positions }
7. new Pieces are made
8. pieces are assigned properties and legal moves
9. Board.positions are assigned a piece.
10. Board.set
11. Board.setSquares (colors the squares)
12. ONCLICK
13. If nothing is selected and it's that color's turn, select the sq
14. If we click on our piece and a piece is already selected change the selection
15. If it's an empty square or opponents piece:
// BEFORE MOVING WE DO 16 - 21
16. Make sure we're not leaving an active path
17. if we're a king, make sure we aren't moving into check
18. if we're in check:
  19. if we're a king, make sure it's one of our escape squares (When are these and the paths reset??)
  20. if we're not, make sure we're moving into the CORRECT (untested) path.
21. if 16, 17, and 18 are ok, check if it's a validMove
22. if 16-21 pass, check if we moved the pathholder, and splice it from the pathholders (does this reset if we just move it back???)
23. if a pawn reached opps side, promote