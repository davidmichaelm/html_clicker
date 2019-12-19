$(function() {
    const game = new Game();
    game.init();
    Cheats.game = game;
});

class Player {
    constructor() {
        this.htmls = 0;
        this.style = 0;
        this.clicks = 0;
        this.openTags = 0;
        this.closeTags = 0;
        this.tagsPerClick = 1;
        this.htmlsPerSecond = 0;
        this.stylePerClick = 1;
        this.stylePerSecond = 0;
        this.clicksPerSecond = 0;
    }

    addSingleTag(type) {
        this[type] += this.tagsPerClick;
        this.updateInventory([type]);

        // If we have matching opening and closing htmls, gain a real tag
        if (this.openTags > 0 && this.closeTags > 0) {
            let number;
            if (this.openTags < this.closeTags) {
                number = this.openTags;
            } else {
                number = this.closeTags;
            }
            this.addHtmls(number);
            this.openTags -= number;
            this.closeTags -= number;
            this.updateInventory(["openTags", "closeTags"]);
        }
    }

    addHtmls(number = this.htmlsPerSecond) {
        this.htmls += number;
        this.updateInventory(["htmls"]);
    }

    addStyle(number = this.stylePerClick) {
        this.style += number;
        this.updateInventory(["style"]);
    }

    addClicks(number = this.clicksPerSecond) {
        this.clicks += number;
        this.updateInventory(["clicks"]);
    }

    // Applies an item's effects to the player
    gainItem(item) {
        let propList = [];
        for (let prop in item.properties) {
            // If statement keeps webstorm from complaining
            // ...and also makes sure we're iterating over something that isn't inherited
            if (item.properties.hasOwnProperty(prop)) {
                this[prop] += item.properties[prop];
                propList.push(prop);
            }
        }

        this.updateInventory(propList);
        return true;

    }


    // Checks if we can buy something, and subtracts the cost from inventory if we can
    buyCheck(cost, costType) {
        if (this[costType] >= cost) {
            this[costType] -= cost;
            this.updateInventory([costType]);
            return true;
        } else {
            return false;
        }
    }

    updateInventory(items) {
        items.forEach((item) => {
            if (item.includes("PerSecond")) {
                $("#" + item).text("(" + this[item] + " per second)");
            } else {
                $("#" + item).text(Math.floor(this[item]));
            }
        });
    }


    loop() {
        this.addHtmls(this.htmlsPerSecond / 10);
        this.addStyle(this.stylePerSecond / 10);
        this.addClicks(this.clicksPerSecond / 10);
    }
}

// Class for the ads module
class Ads {
    constructor(game) {
        this.htmls = {
            cost: 10,
            clicks: 10
        };

        this.style = {
            cost: 3,
            clicks: 10
        };

        this.game = game;
    }

    // Pays a fee to open up the ability to buy ads
    unlock() {
        if (this.game.player.buyCheck(100, "htmls")) {
            $("#unlockAdsButton").hide();
            $("#adsMain").show();
            this.update();

            $("#adsHtmlButton").click($.proxy(this.sell, this, "htmls"));
            $("#adsStyleButton").click($.proxy(this.sell, this, "style"));
        } else {
            // error message
        }
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
}

class CSS {
    constructor() {
        this.availableCssRules = [];
        this.futureCssRules = [];
        this.currentCssRule = "";
        this.input = $("#cssInput");
    }

    propCheck() {
        return this.input.val() === this.currentCssRule;
    }

    doValidInput() {
        this.input.css("background-color", "white");
        this.input.val("");
        this.showNextCssRule();
    }

    doInvalidInput() {
        this.input.css("background-color", "red");
    }

    showNextCssRule() {
        let randomRule = this.availableCssRules[Math.floor(Math.random() * this.availableCssRules.length)];
        let randomValue = randomRule.values[Math.floor(Math.random() * randomRule.values.length)];
        let text = randomRule.property + ": " + randomValue + ";";
        $("#cssNextRule").text(text);
        this.currentCssRule = text;
    }

    addPropFromItem(item) {
        // This line mostly borrowed from MDN on Array.find()
        // Finds object in array with property value of item.name
        let prop = this.futureCssRules.find(({property}) => property === item.name);
        this.availableCssRules.push(prop);
    }
}



// Base class for all three stores. Not used by itself
class Store {
    constructor(game) {
        this.type = "store";
        this.availableItems = [];
        this.futureItems = [];
        this.toUnlockNextItem = 50;
        this.locked = false;
        this.majorUpgradeVersion = 0;
        this.majorUpgradeString = "";
        this.majorUpgradeCost = 50;
        this.game = game;
    }

    // Loops through available items and displays them with their cost and properties
    showItems() {
        let store = $("#" + this.type + "Store");
        store.html("<h2>" + this.type.toUpperCase() + " Store</h2>");

        this.availableItems.forEach((item) => {
            let storeItem = $("<div class='storeItem button'>");
            let ownedText = " (owned: " + item.owned + ")";
            storeItem.text(item.name + (item.owned > 0 ? ownedText : ""));

            storeItem.append("<div>costs " + item.cost + " " + translateProperty(item.costType) + "</div>");

            // If it's a special upgrade, show special description
            if (item.hasOwnProperty("majorUpgrade")) {
                let description = $("<div>").text(item.majorUpgrade.description);
                storeItem.append(description);
            }
            // Otherwise, show the player all the item's properties
            for (let prop in item.properties) {
                // If statement keeps webstorm from complaining
                // ...and also makes sure we're iterating over something that isn't inherited
                if (item.properties.hasOwnProperty(prop)) {
                    let storeItemProp = $("<div>");
                    storeItemProp.append("+" + item.properties[prop] + " " + translateProperty(prop));

                    storeItem.append(storeItemProp);
                }
            }

            storeItem.click($.proxy(this.game.buyItem, this.game, item));
            store.append(storeItem);
        });

        // Show a button to unlock the next upgrade in the store if it's unlocked
        if (!this.locked && this.futureItems.length > 0) {
            let upgradeButton = $("<div class='upgradeButton button'>Unlock next upgrade:<br> " + this.toUnlockNextItem + " clicks</div>");
            upgradeButton.click($.proxy(this.unlockNextItem, this, false));
            store.append(upgradeButton);
        }
    }

    sellItem(item) {
        item.cost = Math.ceil(item.cost * 1.5);
        item.owned++;

        if (item.hasOwnProperty("majorUpgrade")) {
            this.doMajorUpgrade(item);
        }

        this.showItems();
    }

    // Pay a fee to unlock the next upgrade
    unlockNextItem(majorUpgrade) {
        if ((this.game.player.buyCheck(this.toUnlockNextItem, "clicks") || majorUpgrade)
            && this.futureItems.length > 0
            && !this.locked) {
            // If we encounter a major upgrade next, move it to the top of the item list
            if (this.futureItems[0].hasOwnProperty("majorUpgrade")) {
                this.availableItems.unshift(this.futureItems.shift());
            } else {
                this.availableItems.push(this.futureItems.shift());
            }

            if (!majorUpgrade) {
                this.toUnlockNextItem *= 1.5;
            }

            // Unlock the CSS store after unlocking the first html upgrade
            if (this.type === "html" && this.availableItems.length === 2) {
                $("#cssStore").show();
            } else if (this.type === "css" && this.availableItems.length >= 3) {
                // And the JS store after the first CSS upgrade
                $("#jsStore").show();
            }
            this.showItems();
        }
    }

    // Unlock a store if we need to and upgrade the major upgrade version number
    doMajorUpgrade(item) {
        this.majorUpgradeCost = item.cost;

        if (this.locked) {
            this.locked = false;
            this.unlockNextItem(true);
        }

        let type = this.majorUpgradeType;
        let cps;
        if (item.properties === undefined) {
            item.properties = {};
            cps = 50;
        } else {
            cps = Math.floor(item.properties[type] *= 1.1);
        }
        item.properties[type] = cps;

        item.name = this.majorUpgradeString + ++this.majorUpgradeVersion;

        this.showItems();
    }
}

class HtmlStore extends Store {
    constructor(game) {
        super(game);
        this.type = "html";
        this.majorUpgradeVersion = 5;
        this.majorUpgradeString = "HTML";
        this.majorUpgradeType = "tagsPerClick";
    }

    // make tag names lowercase
    doMajorUpgrade(item) {
        this.availableItems.forEach(function (item) {
            if (item.name.includes("<")) {
                item.name = item.name.toLowerCase();
            }
        });

        this.futureItems.forEach(function (item) {
            if (item.name.includes("<")) {
                item.name = item.name.toLowerCase();
            }
        });

        // Change HTML5 to HTML6, etc
        super.doMajorUpgrade(item);
    }
}

class CssStore extends Store {
    constructor(game) {
        super(game);
        this.type = "css";
        this.majorUpgradeVersion = 2;
        this.majorUpgradeString = "CSS";
        this.majorUpgradeType = "stylePerClick";
        this.locked = true;
    }

    // Opens the CSS input for the player to gain style
    doMajorUpgrade(item) {

        $("#css").show();
        $("#adsStyleButton").show();
        this.game.css.showNextCssRule();

        // Change CSS to CSS3, to CSS4, etc
        super.doMajorUpgrade(item);
    }
}

class JsStore extends Store {
    constructor(game, ads) {
        super(game);
        this.type = "js";
        this.majorUpgradeVersion = 5;
        this.majorUpgradeString = "ES";
        this.majorUpgradeType = "clicksPerAd";
        this.locked = true;
        this.ads = ads;
    }

    // Upgrades the output of buying ads
    doMajorUpgrade(item) {
        if (!this.locked) {
            this.ads.upgrade(item.properties.clicksPerAd);
        }

        // Change JS to ES6, to ES7, etc
        super.doMajorUpgrade(item);
    }
}

class Game {
    constructor() {
        this.player = new Player();
        this.ads = new Ads(this);
        this.css = new CSS();
        this.htmlStore = new HtmlStore(this);
        this.cssStore = new CssStore(this);
        this.jsStore = new JsStore(this, this.ads);
        this.stores = [this.htmlStore, this.cssStore, this.jsStore];
    }

    createEventHandlers() {
        // Add event handlers
        // Need to use proxy to get the normal "this" context when using jquery events to call object methods
        $("#tagOpenButton").click($.proxy(this.player.addSingleTag, this.player, "openTags"));
        $("#tagCloseButton").click($.proxy(this.player.addSingleTag, this.player, "closeTags"));
        $("#cssButton").click($.proxy(this.validateStyleInput, this));
        $("#cssInput").keydown((event) => {
            if (event.which === 13) {
                this.validateStyleInput(event);
            }
        });
        $("#unlockAdsButton").click($.proxy(this.ads.unlock, this.ads));
    }

    populateStores() {
        $.ajaxSetup({cache: false}); // uncomment to change json files
        $.getJSON("storeitems.json", (storeItems) => {
            for (let item of storeItems) {
                for (let store of this.stores) {
                    if (item.type === store.type) {
                        store.futureItems.push(item);
                    }
                }
            }

            // Show only the first item of each store
            this.stores.forEach((store) => {
                store.availableItems.push(store.futureItems.shift());
                store.showItems();
            });

        });
    }

    getCssRules() {
        $.getJSON("cssrules.json", (rules) => {
            this.css.availableCssRules.push(rules.shift());
            this.css.futureCssRules = rules;
        });
    }

    validateStyleInput(event) {
        event.preventDefault();
        if (this.css.propCheck()) {
            this.player.addStyle(this.player.stylePerClick);
            this.css.doValidInput();
        } else {
            this.css.doInvalidInput();
        }
    }

    buyItem(item) {
        if (this.player.buyCheck(item.cost, item.costType)) {
            this.player.gainItem(item);
            this[item.type + "Store"].sellItem(item);


            if (item.type === "css" && item.owned === 0) {
                this.css.addPropFromItem(item);
            }
        }
    }

    init() {
        this.createEventHandlers();
        this.populateStores();
        this.getCssRules();
        setInterval(this.player.loop.bind(this.player), 100);
    }
}

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

// Translates property names into English
function translateProperty(prop) {
    switch (prop) {
        case "htmlsPerSecond":
            return "htmls per second";
        case "clicksPerSecond":
            return "clicks per second";
        case "stylePerSecond":
            return "style per second";
        case "tagsPerClick":
            return "<> or &lt;/&gt; per click";
        case "stylePerClick":
            return "style per property entered";
        case "clicksPerAd":
            return "clicks per ad sold";
        default:
            return prop;
    }
}
