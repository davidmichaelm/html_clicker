import {Game} from "./game.js";

$(function () {
    setUpGame();
});

const Cheats = {
    game: {},
    clicks: function () {
        this.game.player.addClicks(999999);
        return "Cheater!";
    },
    htmls: function () {
        this.game.player.addHtmls(9999999);
        return "Cheater!";
    },
    style: function () {
        this.game.player.addStyle(9999999);
        return "Cheater!";
    }
};

function setUpGame(game = null) {
    if (game) {
        game.reset();
        game = null;
    }

    game = new Game();
    Cheats.game = game;
    window.cheats = Cheats;

    $("#resetGame").click(() => setUpGame(game));
}