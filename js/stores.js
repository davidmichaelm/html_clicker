// Base class for all three stores. Not used by itself
export class Store {
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
        if (!this.locked) {
            store.show();
        }
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
        if (this.locked === false && this.futureItems.length > 0) {
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
                //this.game.stores.find(store => store.type === "css").locked = false;
            } else if (this.type === "css" && this.availableItems.length >= 3) {
                // And the JS store after the first CSS upgrade
                $("#jsStore").show();
                //this.game.stores.find(store => store.type === "js").locked = false;
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

    save() {
        localStorage.setItem(this.type + "availableItems", JSON.stringify(this.availableItems));
        localStorage.setItem(this.type + "futureItems", JSON.stringify(this.futureItems));
        for (let field in this) {
            if (this.hasOwnProperty(field) && field !== "game" && field !== "type" && field !== "availableItems" && field !== "futureItems") {
                localStorage.setItem(this.type + field, this[field]);
            }
        }
    }

    load() {
        let availableItems = JSON.parse(localStorage.getItem(this.type + "availableItems"));
        let futureItems = JSON.parse(localStorage.getItem(this.type + "futureItems"));

        if (availableItems && futureItems) {
            this.availableItems = availableItems;
            this.futureItems = futureItems;
        } else {
            return false; // Didn't load anything
        }

        for (let field in this) {
            let item = localStorage.getItem(this.type + field);
            if (this.hasOwnProperty(field) && field !== "game" && field !== "type" && item && field !== "availableItems" && field !== "futureItems") {
                this[field] = isNaN(Number(item)) ? item : Number(item);
            }
        }

        this.locked = localStorage.getItem(this.type + "locked") === true;
        this.showItems();
    }

    getStoreItems() {
        $.ajaxSetup({cache: false}); // uncomment to change json files
        $.getJSON(this.type + "store.json", (storeItems) => {
            for (let item of storeItems) {
                this.futureItems.push(item);
            }

            // Show only the first item
            this.availableItems.push(this.futureItems.shift());
            this.showItems();
        });
    }
}

export class HtmlStore extends Store {
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

export class CssStore extends Store {
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

export class JsStore extends Store {
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