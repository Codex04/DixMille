using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class AddScore
{
    private GameState? _game;
    private Player? _player;
    
    [Parameter, EditorRequired] public int GameId { get; set; } = default!;
    [Parameter, EditorRequired] public string PlayerName { get; set; } = default!;

    [Inject] public NavigationManager NavigationManager { get; set; } = null!;
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        _game = await LocalStorageService.GetItemAsync<GameState>($"game-{GameId}");

        if (_game == null)
            return;
        _player = _game.Players.FirstOrDefault(player => player.Name.Equals(PlayerName, StringComparison.OrdinalIgnoreCase));
    }
    
    private void NavigateBackToGame()
        => NavigationManager.NavigateTo($"game/{GameId}");
}