namespace DixMille.Models;

public class GameState
{
    public required int Id { get; init; }
    public required Player[] Players { get; init; } = [];
    public string LastPlayerName { get; set; } = string.Empty;
}