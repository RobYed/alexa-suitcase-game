'use strict';
const Alexa = require('alexa-sdk');
const itemList = require('./items.json').items;

const APP_ID = 'amzn1.ask.skill.480b7029-32cb-4d29-9a9c-dac3d9c4316e';

exports.handler = function(event, context, callback) {
    let alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

let handlers = {
    'LaunchRequest': function () {
        this.emit('StartSuitecaseGameIntent');
    },
    'StartSuitecaseGameIntent': function () {
        this.emit(':ask', 'Schön, dass du mit mir spielen willst. Du fängst an, was nimmst du mit?');
    },
    'RepeatAndExtendIntent': function () {
        let repeatedItems, newUserItem, newAlexaItem;

        // first, check if this is the first item
        if (!this.attributes['items']) {
            this.attributes['items'] = [];
        // if it is not the first item check the repeated items
        } else {
            let repeatedItemsSlot = this.event.request.intent.slots.Items;
            if (repeatedItemsSlot && repeatedItemsSlot.value) {
                let repeatedItemsArray = _getItemArrayFromString(repeatedItemsSlot.value);
                
                // check, if items are repeated correctly
                if ( !_areItemsCorrect(repeatedItemsArray, this.attributes['items']) ) {
                    this.emit('GameOverIntend');
                    return;
                }
            }
        }

        // save the user's new item to the session
        let itemSlot = this.event.request.intent.slots.Item;
        if (itemSlot && itemSlot.value) {
            newUserItem = itemSlot.value;
            this.attributes['items'].push(newUserItem);
        } else {
            console.warn('No new user item found');
        }
        
        // get a new random item and save it
        newAlexaItem = _getRandomItem();
        this.attributes['items'].push(newAlexaItem);
        
        this.emit(':ask', 'Ich packe meinen Koffer und nehme mit. ' + _getItemStringfromArray(this.attributes['items']) );
    },
    'GameOverIntend': function() {
        this.emit(':tell', 'Leider war das nicht richtig. Du hast verloren.');
    },
    'SessionEndedRequest': function() {
        this.emit(':tell', 'Danke fürs Spielen.');
    }
};

function _areItemsCorrect(repeatedItems, savedItems) {
    if (repeatedItems.length !== savedItems.length) {
        return false;
    }
    return savedItems.filter(function(item) {
        return !repeatedItems.includes(item);
    }).length === 0;
}

function _getRandomItem() {
    return itemList[ Math.floor(Math.random() * itemList.length) ];
}

function _getItemArrayFromString(itemString) {
    return itemString.split(' ');
}

function _getItemStringfromArray(itemArray) {
    let itemsWithoutLast = itemArray.slice(0, itemArray.length - 1);
    const lastItem = itemArray[itemArray.length - 1];
    return itemsWithoutLast.join(', ') + ' und ' + lastItem;
}