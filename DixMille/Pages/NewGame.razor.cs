using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class NewGame
{
    private readonly List<Player> _players = new();

    private Player _newPlayer = new();
    
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    private bool IsNewPlayerNameValid => !string.IsNullOrWhiteSpace(_newPlayer.Name) && !_players.Any(player => player.Name.Equals(_newPlayer.Name, StringComparison.OrdinalIgnoreCase));
    
    private IEnumerable<Player> ValidPlayers => IsNewPlayerNameValid ? _players.Append(_newPlayer) : _players;
    
    private void AddNewPlayer()
    {
        _players.Add(_newPlayer);
        _newPlayer = new Player();
    }
    
    private async Task OnStartNewGameClickedAsync()
    {
        var keys = await LocalStorageService.KeysAsync();
        var gameIds = keys
            .Where(key => key.StartsWith("game-"))
            .Select(key => int.Parse(key.Replace("game-", string.Empty)))
            .ToArray();
        var newGameId = gameIds.Any() ? gameIds.Max() + 1 : 1;

        var newGame = new GameState()
        {
            Id = newGameId, 
            Players = ValidPlayers.ToArray(),
        };
        await LocalStorageService.SetItemAsync($"game-{newGame.Id}", newGame);
        NavigationManager.NavigateTo($"game/{newGame.Id}");
    }
}