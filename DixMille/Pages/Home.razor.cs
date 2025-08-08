using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Home
{
    private string Name { get; set; } = "Toto";
    private GameState? _lastNotFinishedGame;
    
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        var gameKeys = await LocalStorageService.KeysAsync();
        var gameIds = gameKeys
            .Where(key => key.StartsWith("game-"))
            .Select(key => int.Parse(key.Replace("game-", string.Empty)))
            .ToArray();

        if (gameIds.Length > 0)
        {
            var lastGame = await LocalStorageService.GetItemAsync<GameState>($"game-{gameIds.Max()}");
            if (string.IsNullOrEmpty(lastGame?.WinnerPlayerName))
                _lastNotFinishedGame = lastGame;
        }
    }

    private void NavigateToNewGamePage()
        => NavigationManager.NavigateTo("new-game");
    
    private void NavigateToLastNotFinishedGame()
    {
        if (_lastNotFinishedGame is null)
            return;
        NavigationManager.NavigateTo($"game/{_lastNotFinishedGame.Id}");
    }
}