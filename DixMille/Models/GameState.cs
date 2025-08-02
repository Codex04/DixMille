namespace DixMille.Models;

public class GameState
{
    public int Id { get; init; }
    public Player[] Players { get; init; } = [];
}