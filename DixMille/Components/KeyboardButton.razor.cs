using Microsoft.AspNetCore.Components;

namespace DixMille.Components;

public partial class KeyboardButton
{
    [Parameter] public int? Number { get; set; }
    [Parameter] public string? MudIcon { get; set; }
    [Parameter] public string Width { get; set; } = "calc(100% / 3)";
    [Parameter] public EventCallback OnClick { get; set; }
}