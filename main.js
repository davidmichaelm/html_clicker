$(function() {
    const ads = new Ads();

    // Add event handlers
    // Need to use proxy to get the normal "this" context when using jquery events to call object methods
    $("#tagOpenButton").click($.proxy(Game.addSingleTag, Game, "openTags"));
    $("#tagCloseButton").click($.proxy(Game.addSingleTag, Game, "closeTags"));
    $("#cssButton").click($.proxy(Game.addStyle, Game));
    $("#unlockAdsButton").click($.proxy(ads.unlock, ads));

    // Populate the stores
    const htmlStore = new HtmlStore();
    const cssStore = new CssStore();
    const jsStore = new JsStore(ads);
    const stores = [htmlStore, cssStore, jsStore];

    $.ajaxSetup({ cache: false }); // uncomment to change json files
    $.getJSON("storeitems.json", function(storeItems) {
        for (let item of storeItems) {
            for (let store of stores) {
                if (item.type === store.type) {
                    store.futureItems.push(item);
                }
            }
        }

        // Show only the first item of each store
        stores.forEach((store) => {
            store.availableItems.push(store.futureItems.shift());
            store.showItems();
        });

    });

    // Get CSS rules
    $.getJSON("cssrules.json", function(rules) {
        Game.availableCssRules.push(rules.shift());
        Game.futureCssRules = rules;
    });


    // Start game loop
    setInterval(function() {
        Game.htmls += Game.htmlsPerSecond / 10;
        Game.style += Game.stylePerSecond / 10;
        Game.clicks += Game.clicksPerSecond / 10;

        Game.updateInventory(["htmls", "style", "clicks"]);
    }, 100);
});

// Handles the player's stats
const Game = {
    htmls: 0,
    openTags: 0,
    closeTags: 0,
    tagsPerClick: 1,
    htmlsPerSecond: 0,
    style: 0,
    stylePerClick: 1,
    stylePerSecond: 0,
    clicks: 0,
    clicksPerSecond: 0,
    items: [],
    futureCssRules: [],
    availableCssRules: [],
    currentCssRule: "",
    // Adds either an opening or a closing tag to the inventory
    addSingleTag: function(type) {
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
    },
    addHtmls: function(number) {
        this.htmls += number;
        this.updateInventory(["htmls"]);
    },
    // Checks if we have enough currency to buy the item, pays the fees and then applies its effects to the player
    gainItem: function(item) {
        if (this[item.costType] >= item.cost) {
            this[item.costType] -= item.cost;

            let propList = [];
            for (let prop in item.properties) {
                // If statement keeps webstorm from complaining
                // ...and also makes sure we're iterating over something that isn't inherited
                if (item.properties.hasOwnProperty(prop)) {
                    this[prop] += item.properties[prop];
                    propList.push(prop);
                }
            }

            if (item.type === "css" && item.owned === 0) {
                // This line mostly borrowed from MDN on Array.find()
                // Finds object in array with property value of item.name
                let prop = this.futureCssRules.find(({property}) => property === item.name);
                this.availableCssRules.push(prop);
            }

            this.updateInventory(propList);
            return true;
        } else {
            return false;
        }
    },
    // Checks if we have enough currency to buy something and pays the fees
    buySomething: function(cost, costType) {
        if (this[costType] >= cost) {
            this[costType] -= cost;
            return true;
        } else {
            return false;
        }
    },
    // Takes an array of strings with item names and updates them on the screen
    updateInventory: function(items) {
        items.forEach(function(item) {
            if (item.includes("PerSecond")) {
                $("#" + item).text("(" + Math.floor(Game[item]) + " per second)");
            } else {
                $("#" + item).text(Math.floor(Game[item]));
            }
        });
    },
    // Shows the next property for the player to type
    showNextCssRule: function() {
        let randomRule = this.availableCssRules[Math.floor(Math.random() * this.availableCssRules.length)];
        let randomValue = randomRule.values[Math.floor(Math.random() * randomRule.values.length)];
        let text = randomRule.property + ": " + randomValue + ";";
        $("#cssNextRule").text(text);
        this.currentCssRule = text;
    },
    addStyle: function(event) {
        event.preventDefault();
        let input = $("#cssInput");
        if (input.val() === this.currentCssRule) {
            this.style += this.stylePerClick;

            input.css("background-color", "white");
            input.val("");
            this.showNextCssRule();
        } else {
            // error message
            input.css("background-color", "red");
        }
    },
    addClicks: function(number) {
        this.clicks += number;
        this.updateInventory(["clicks"]);
    }
};

/*{[{
    "name": "string",
    "type": "html, css, or js",
    "owned": number,
    "cost": number,
    "htmlsPerSecond": number,
    "stylePerSecond": number,
    "clicksPerSecond": number,
    "htmlsPerClick": number,
    "stylePerClick": number,
    "clicksPerClick": number
]}*/

// Class for the ads module
class Ads {
    constructor() {
        this.htmls = {
            cost: 10,
            clicks: 10
        };

        this.style = {
            cost: 3,
            clicks: 10
        };
    }

    // Pays a fee to open up the ability to buy ads
    unlock() {
        if (Game.buySomething(100, "htmls")) {
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
        if (Game.buySomething(this[type].cost, type)) {
            Game.addClicks(this[type].clicks);
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

// Base class for all three stores. Not used by itself
class Store {
    constructor() {
        this.type = "store";
        this.availableItems = [];
        this.futureItems = [];
        this.toUnlockNextItem = 50;
        this.locked = false;
        this.majorUpgradeVersion = 0;
        this.majorUpgradeString = "";
        this.majorUpgradeCost = 50;
    }

    // Loops through available items and displays them with their cost and properties
    showItems() {
        let store = $("#" + this.type + "Store");
        store.html("<h2>" + this.type.toUpperCase() + " Store</h2>");

        let self = this;
        this.availableItems.forEach(function(item) {
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
                    storeItemProp.append("+" + item.properties[prop]+ " " + translateProperty(prop));

                    storeItem.append(storeItemProp);
                }
            }

            storeItem.click($.proxy(self.buyItem, self, item));
            store.append(storeItem);
        });

        // Show a button to unlock the next upgrade in the store if it's unlocked
        if (!this.locked && this.futureItems.length > 0) {
            let upgradeButton = $("<div class='upgradeButton button'>Unlock next upgrade:<br> " +this.toUnlockNextItem + " clicks</div>");
            upgradeButton.click($.proxy(this.unlockNextItem, this, false));
            store.append(upgradeButton);
        }
    }

    buyItem(item) {
        // If the player succeeds in buying the item, change its cost
        if (Game.gainItem(item)) {
            item.cost = Math.ceil(item.cost * 1.5);
            item.owned++;

            if (item.hasOwnProperty("majorUpgrade")) {
                this.doMajorUpgrade(item);
            }

            this.showItems();
        } else {
            // show error message
        }
    }

    // Pay a fee to unlock the next upgrade
    unlockNextItem(majorUpgrade) {
        if ((Game.buySomething(this.toUnlockNextItem, "clicks") || majorUpgrade)
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

    // Pay a fee, unlock a store if we need to, and upgrades the major upgrade version number
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
    constructor() {
        super();
        this.type = "html";
        this.majorUpgradeVersion = 5;
        this.majorUpgradeString = "HTML";
        this.majorUpgradeType = "tagsPerClick";
    }

    // make tag names lowercase
    doMajorUpgrade(item) {
        this.availableItems.forEach(function(item) {
            if (item.name.includes("<")) {
                item.name = item.name.toLowerCase();
            }
        });

        this.futureItems.forEach(function(item) {
            if (item.name.includes("<")) {
                item.name = item.name.toLowerCase();
            }
        });

        // Change HTML5 to HTML6, etc
        super.doMajorUpgrade(item);
    }
}

class CssStore extends Store {
    constructor() {
        super();
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
        Game.showNextCssRule();

        // Change CSS to CSS3, to CSS4, etc
        super.doMajorUpgrade(item);
    }
}

class JsStore extends Store {
    constructor(ads) {
        super();
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