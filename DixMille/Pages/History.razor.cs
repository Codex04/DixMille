using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class History : ComponentBase
{
    private bool _isLoading = true;
    private GameState[] _games = [];
    
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        _isLoading = true;
        await InvokeAsync(StateHasChanged);
        
        var gameKeys = await LocalStorageService.KeysAsync();
        var unorderedGames = new List<GameState>();
        
        foreach (var gameKey in gameKeys)
        {
            var game = await LocalStorageService.GetItemAsync<GameState>(gameKey);
            if (string.IsNullOrEmpty(game?.WinnerPlayerName))
                continue;
            unorderedGames.Add(game);
        }
        _games = unorderedGames.OrderByDescending(game => game.CreationDate).ToArray();
        
        _isLoading = false;
        await InvokeAsync(StateHasChanged);
    }
    
    private void NavigateToHome()
        => NavigationManager.NavigateTo("");
}