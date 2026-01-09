from services.TicTacToeService import TicTacToeService


def main():
    service = TicTacToeService()

    # Initialize empty game
    game = service.init_empty_game()

    # Move sequence: (player, board, position)
    moves = [
        ('X', 'center', 'topleft'),
        ('O', 'topleft', 'topmiddle'),
        ('X', 'topmiddle', 'topleft'),
        ('O', 'topleft', 'topright'),
        ('X', 'topright', 'topleft'),
        ('O', 'topleft', 'middleleft'),
        ('X', 'middleleft', 'topleft'),
        ('O', 'topleft', 'center'),
        ('X', 'center', 'topmiddle'),
        ('O', 'topmiddle', 'center'),
        ('X', 'center', 'topright'),
        ('O', 'topright', 'middleleft'),
        ('X', 'middleleft', 'topmiddle'),
        ('O', 'topmiddle', 'middleleft'),
        ('X', 'middleleft', 'topright'),
        ('O', 'topright', 'middleright'),
        ('X', 'middleright', 'topmiddle'),
        ('O', 'topmiddle', 'middleright'),
        ('X', 'middleright', 'topleft'),
        ('O', 'topleft', 'middleright'),
        ('X', 'middleright', 'topright'),
        ('O', 'topright', 'bottomright')
    ]


    for i, (player, board, position) in enumerate(moves, start=1):
        print(f"\nTurn {i}: {player} plays {board}.{position}")

        try:
            service.take_turn(
                game=game,
                player=player,
                corner=board,
                position=position,
            )
        except Exception as e:
            print("\nERROR during move execution:")
            print(f"  {type(e).__name__}: {e}")
            print("\nBoard state at error:")
            game.current_game.print_ascii()
            return

        # Check for winner WITHOUT calling updateSelf
        winner = game.current_game.winner
        if winner:
            print("\nGAME FINISHED")
            print(f"Winner: {winner}")
            print("\nFinal board:")
            game.current_game.print_ascii()

    print("\nMove list exhausted without a winner.")
    print("\nFinal board:")
    game.current_game.print_ascii()


if __name__ == "__main__":
    main()
