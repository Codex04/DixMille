using Microsoft.AspNetCore.Components;

namespace DixMille.Components;

public partial class KeyboardButton
{
    [Parameter] public int? Number { get; set; }
    [Parameter] public RenderFragment? ChildContent { get; set; }
}