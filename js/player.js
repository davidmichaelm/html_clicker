export class Player {
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
        this.clicksPerAd = 10;

        this.updateInventory(["openTags", "closeTags"]);
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

    save() {
        for (let field in this) {
            if (this.hasOwnProperty(field)) {
                localStorage.setItem(field, this[field]);
            }
        }
    }

    load() {
        for (let field in this) {
            if (this.hasOwnProperty(field)) {
                let item = localStorage.getItem(field);
                if (this.hasOwnProperty(field) && item) {
                    this[field] = Number(item);
                    if (this[field] > 0) {
                        this.updateInventory([field]);
                    }
                }
            }
        }
    }

    clearSave() {
        for (let field in this) {
            if (this.hasOwnProperty(field)) {
                localStorage.removeItem(field);
            }
        }
    }

    reset() {
        $("#htmlsPerSecond").text("");
        $("#clicksPerSecond").text("");
    }
}