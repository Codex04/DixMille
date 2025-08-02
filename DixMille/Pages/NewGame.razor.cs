using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class NewGame
{
    private List<Player> _players = new();
    
    private string _newPlayerName = string.Empty;
    
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;

    private void OnAddNewPlayerClicked()
    {
        _players.Add(new Player { Name = _newPlayerName });
        ResetNewPlayerState();
    }
    
    private void OnStartNewGameClicked()
    {
        
    }

    private void ResetNewPlayerState()
    {
        _newPlayerName = string.Empty;
    }
}