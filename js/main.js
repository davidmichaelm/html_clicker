import {Game} from "./game.js";

$(function() {
    const game = new Game();
    game.init();
    Cheats.game = game;
});

const Cheats = {
    game: {},
    clicks: function() {
        this.game.player.addClicks(999999);
        return "Cheater!";
    },
    htmls: function() {
        this.game.player.addHtmls(9999999);
        return "Cheater!";
    },
    style: function() {
        this.game.player.addStyle(9999999);
        return "Cheater!";
    }
};