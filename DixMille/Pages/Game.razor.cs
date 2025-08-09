using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Game
{
    private GameState? _game;
    
    [Parameter] public int GameId { get; set; }

    [Inject] public NavigationManager NavigationManager { get; set; } = null!;
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        _game = await LocalStorageService.GetItemAsync<GameState>($"game-{GameId}");
    }

    private bool ShouldDisplayCup(Player player)
        => (string.IsNullOrEmpty(_game?.WinnerPlayerName) && player.Score is not 0 && _game?.Players.MaxBy(p => p.Score)?.Score == player.Score)
        || _game?.WinnerPlayerName == player.Name;

    private bool ShouldDisplayPoop(Player player)
        => player.Score is not 0 
        && _game?.Players.MinBy(p => p.Score)?.Score == player.Score
        && _game?.WinnerPlayerName != player.Name;
    
    private void OnPlayerClicked(Player player)
    {
        NavigationManager.NavigateTo($"game/{GameId}/add-score/{player.Name}");
    }
    
    private void NavigateToHome()
        => NavigationManager.NavigateTo("");
}
