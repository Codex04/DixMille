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
    
    private void OnStartNewGameClicked()
    {
        var gameId = 1; // Get an unused game id
        NavigationManager.NavigateTo($"game/{gameId}");
    }

    private void ResetNewPlayerState()
    {
        _newPlayerName = string.Empty;
    }
}