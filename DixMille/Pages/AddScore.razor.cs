using Blazored.LocalStorage;
using DixMille.Models;
using Microsoft.AspNetCore.Components;

namespace DixMille.Pages;

public partial class AddScore
{
    private GameState? _game;
    private Player? _player;
    private int _scoreToAdd;
    private bool _isMinus;
    
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

    private void UpdateScoreToAdd(char value)
    {
        var scoreToAddAsStr = _scoreToAdd.ToString();
        switch (value)
        {
            case '\b': // Backspace
                int.TryParse(scoreToAddAsStr.Substring(0, scoreToAddAsStr.Length - 1), out _scoreToAdd);
                return;
            case '-':
                _isMinus = !_isMinus;
                return;
            default:
                int.TryParse($"{scoreToAddAsStr}{value}", out _scoreToAdd);
                break;
        }
    }

    private async Task SaveScoreAsync()
    {
        if (_game is not null && _player is not null)
        {
            _player.Score += _isMinus ? -_scoreToAdd : _scoreToAdd;
            _game.LastPlayerName = PlayerName;
            if (_player.Score >= 10000 && string.IsNullOrEmpty(_game.WinnerPlayerName))
                _game.WinnerPlayerName = _player.Name;
            await LocalStorageService.SetItemAsync($"game-{_game.Id}", _game);
        }
        NavigateBackToGame();
    }
}