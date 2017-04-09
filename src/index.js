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
        console.log('LaunchRequest');

        this.emit('StartSuitecaseGameIntent');
    },
    'StartSuitecaseGameIntent': function () {
        console.log('StartSuitecaseGameIntent');

        this.emit(':ask', 'Schön, dass du mit mir spielen willst. Du fängst an, was nimmst du mit?');
    },
    'RepeatAndExtendIntent': function () {
        console.log('RepeatAndExtendIntent:', this.event, this.attributes);

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
                    this.emit('GameOverIntend', repeatedItemsArray);
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
            console.warn('RepeatAndExtendIntent: No new user item found');
        }
        
        // get a new random item and save it
        newAlexaItem = _getRandomItem();
        this.attributes['items'].push(newAlexaItem);
        
        this.emit(':ask', 'Ich packe meinen Koffer und nehme mit. ' + _getItemStringfromArray(this.attributes['items']) );
    },
    'GameOverIntend': function(repeatedItemsArray) {
        console.log('GameOverIntent', repeatedItemsArray, this.attributes);

        let gameOverMessage = 'Leider war das nicht richtig.';

        let forgottenItems = _getForgottenItems(repeatedItemsArray, this.attributes['items']);
        if (forgottenItems.length) {
            gameOverMessage += ' Du hast ' + _getItemStringfromArray(forgottenItems) + ' vergessen.';
        }

        let unnecessaryItems = _getUnnecessaryItems(repeatedItemsArray, this.attributes['items']);
        if (unnecessaryItems.length) {
            gameOverMessage += ' ' + _getItemStringfromArray(unnecessaryItems) + ' hat niemand eingepackt.'; 
        }

        gameOverMessage += ' Du hast damit verloren.';
        
        this.emit(':tell', gameOverMessage);
    },
    'SessionEndedRequest': function() {
        console.log('SessionEndedRequest');

        this.emit(':tell', 'Danke fürs Spielen.');
    }
};

function _areItemsCorrect(repeatedItems, savedItems) {
    // if length of items is not equal we can instantly stop here
    if (repeatedItems.length !== savedItems.length) {
        return false;
    }
    // if length of items is equal we can still have forgotten and unnecessary items
    let areItemsForgotten = _getForgottenItems(repeatedItems, savedItems).length !== 0;
    let areItemsUnnecessary = _getUnnecessaryItems(repeatedItems, savedItems).length !== 0;
    return !areItemsForgotten && !areItemsUnnecessary;
}

function _getForgottenItems(repeatedItems, savedItems) {
    return savedItems.filter(function(item) {
        return !repeatedItems.includes(item);
    });
}

function _getUnnecessaryItems(repeatedItems, savedItems) {
    return repeatedItems.filter(function(item) {
        return !savedItems.includes(item);
    });
}

function _getRandomItem() {
    return itemList[ Math.floor(Math.random() * itemList.length) ];
}

function _getItemArrayFromString(itemString) {
    return itemString.split(' ');
}

function _getItemStringfromArray(itemArray) {
    if (itemArray.length === 0) {
        return '';
    }
    if (itemArray.length === 1) {
        return itemArray[0];
    }
    let itemsWithoutLast = itemArray.slice(0, itemArray.length - 1);
    const lastItem = itemArray[itemArray.length - 1];
    return itemsWithoutLast.join(', ') + ' und ' + lastItem;
}