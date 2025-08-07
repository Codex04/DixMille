using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Home
{
    private string Name { get; set; } = "Toto";
    
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;
    [Inject] public NavigationManager NavigationManager { get; set; } = null!;

    private void OnNewGameClicked()
        => NavigationManager.NavigateTo("new-game");
    
    private async Task LoadStorageAsync()
    {
        await LocalStorageService.SetItemAsync("name", "John Smith");
        Name = await LocalStorageService.GetItemAsync<string>("name") ?? "Not found";
        await InvokeAsync(StateHasChanged);
    }
}