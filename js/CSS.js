export class CSS {
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

    save() {
        localStorage.setItem("availableCssRules", JSON.stringify(this.availableCssRules));
        localStorage.setItem("futureCssRules", JSON.stringify(this.futureCssRules));
        localStorage.setItem("currentCssRule", this.currentCssRule);
    }

    load() {
        let availableCssRules = JSON.parse(localStorage.getItem("availableCssRules"));
        let futureCssRules = JSON.parse(localStorage.getItem("futureCssRules"));
        let currentCssRule = localStorage.getItem("currentCssRule");

        if (availableCssRules && futureCssRules && currentCssRule) {
            this.availableCssRules = availableCssRules;
            this.futureCssRules = futureCssRules;
            this.currentCssRule = currentCssRule;
        }
    }

    clearSave() {
        localStorage.removeItem("availableCssRules");
        localStorage.removeItem("futureCssRules");
        localStorage.removeItem("currentCssRule");
    }
}