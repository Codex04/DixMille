using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Game
{
    private GameState? _game;
    
    [Parameter] public int GameId { get; set; }

    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        _game = await LocalStorageService.GetItemAsync<GameState>($"game-{GameId}");
    }
}