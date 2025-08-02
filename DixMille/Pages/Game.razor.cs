using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Game
{
    [Parameter] public int GameId { get; set; }

    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;
    
    protected override async Task OnInitializedAsync()
    {
    }
}