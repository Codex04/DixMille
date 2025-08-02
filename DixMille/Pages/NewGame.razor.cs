using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class NewGame
{
    private List<Player> _players = new();
    
    private string _newPlayerName = string.Empty;
    
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    private void OnAddNewPlayerClicked()
    {
        _players.Add(new Player { Name = _newPlayerName });
        ResetNewPlayerState();
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
            Players = _players.ToArray(),
        };
        await LocalStorageService.SetItemAsync($"game-{newGame.Id}", newGame);
        NavigationManager.NavigateTo($"game/{newGame.Id}");
    }

    private void ResetNewPlayerState()
    {
        _newPlayerName = string.Empty;
    }
}