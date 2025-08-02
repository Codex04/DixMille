using Blazored.LocalStorage;
using DixMille.Services;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class Home
{
    private string Name { get; set; } = "Toto";
    
    [Inject] public GameService GameService { get; set; } = null!;
    [Inject] public ILocalStorageService LocalStorageService { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        //await LocalStorageService.SetItemAsync("name", "John Smith");
    }

    private async Task LoadStorageAsync()
    {
        Name = await LocalStorageService.GetItemAsync<string>("name") ?? "Not found";
        await InvokeAsync(StateHasChanged);
    }
}