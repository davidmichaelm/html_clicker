// Class for the ads module
export class Ads {
    constructor(game) {
        this.htmls = {
            cost: 10,
            clicks: 10
        };

        this.style = {
            cost: 3,
            clicks: 10
        };

        this.unlocked = false;

        this.game = game;
    }

    // Pays a fee to open up the ability to buy ads
    unlock() {
        if (this.game.player.buyCheck(100, "htmls")) {
            this.show();
            this.unlocked = true;
        } else {
            // error message
        }
    }

    show() {
        $("#unlockAdsButton").hide();
        $("#adsMain").show();
        this.update();

        $("#adsHtmlButton").click($.proxy(this.sell, this, "htmls"));
        $("#adsStyleButton").click($.proxy(this.sell, this, "style"));
    }

    // Sells htmls or style in exchange for clicks
    sell(type) {
        if (this.game.player.buyCheck(this[type].cost, type)) {
            this.game.player.addClicks(this[type].clicks);
            this[type].cost = Math.ceil(this[type].cost * 1.4);
        }
        this.update();
    }

    // Upgrades how many clicks the player gets from selling htmls and style
    upgrade(number) {
        this.htmls.clicks += number;
        this.style.clicks += number;
        this.update();
    }

    update() {
        $("#adsHtml").text(this.htmls.cost);
        $("#adsHtmlClicks").text(this.htmls.clicks);
        $("#adsStyle").text(this.style.cost);
        $("#adsStyleClicks").text(this.style.clicks);
    }

    save() {
        localStorage.setItem("adsHtmls", JSON.stringify(this.htmls));
        localStorage.setItem("adsStyle", JSON.stringify(this.style));
    }

    load() {
        let htmls = JSON.parse(localStorage.getItem("adsHtmls"));
        let style = JSON.parse(localStorage.getItem("adsStyle"));

        if (htmls && style) {
            this.htmls = htmls;
            this.style = style;
            this.show();
        }
    }
}