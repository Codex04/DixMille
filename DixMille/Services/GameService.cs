using DixMille.Models;

namespace DixMille.Services;

public class GameService
{
    public GameService()
    {
        Players.Add(new() { Name = "Sacha" });
        Players.Add(new() { Name = "Julie" });
        Players.Add(new() { Name = "Clem" });
        Players.Add(new() { Name = "Quentin" });
    }

    public List<Player> Players { get; } = [];
}