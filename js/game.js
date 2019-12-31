import {Player} from "./player.js";
import {Ads} from "./ads.js";
import {CSS} from "./CSS.js";
import {CssStore, HtmlStore, JsStore} from "./stores.js";

export class Game {
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

    getStoreItems() {
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
            this[item.type + "Store"].save();
        }
    }

    loadAll() {
        this.player.load();

        this.stores.forEach((store) => {
            if (store.load() === false) { // If we load something from localStorage, don't mess anymore with the store
                store.getStoreItems();
            }
        });

        this.css.load();
        this.ads.load();
    }

    init() {
        this.createEventHandlers();
        this.getCssRules();
        this.loadAll();
        setInterval(this.player.loop.bind(this.player), 100);

        // Save automatically every 10 second
        setInterval(() => {
            this.player.save();
            this.stores.forEach((store) => {
                store.save();
            });
            this.css.save();
            this.ads.save();
        }, 10000);
    }
}
