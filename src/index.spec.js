'use strict';
var bst = require('bespoken-tools');
var chai = require('chai');

var assert = chai.assert;
chai.use(require('chai-string'));

var server = null;
var alexa = null;

beforeEach(function (done) {
    server = new bst.LambdaServer('./index.js', 10000, true);
    alexa = new bst.BSTAlexa('http://localhost:10000',
                             '../speechAssets/IntentSchema.json',
                             '../speechAssets/Utterances.txt');
    server.start(function() {
        alexa.start(function (error) {
            if (error !== undefined) {
                console.error("Error: " + error);
            } else {
                done();
            }
        });
    });
});

afterEach(function(done) {
    alexa.stop(function () {
        server.stop(function () {
            done();
        });
    });
});

it('Launches and tells user to start the game', function (done) {
    // Launch the skill via sending it a LaunchRequest
    alexa.launched(function (error, payload) {
        // Check that the introduction is played as outputSpeech
        assert.equal(
          payload.response.outputSpeech.ssml, 
          '<speak> Schön, dass du mit mir spielen willst. Du fängst an, was nimmst du mit? </speak>'
        );
        done();
    });
});

it('Repeats the user´s first item and adds a new one', function(done) {
    alexa.spoken('Ich packe meinen Koffer und nehme mit. {Plastikpalme}', function (error, payload) {
      const items = payload.sessionAttributes.items;
      const newItem = items[items.length -1];

      assert.equal(
        payload.response.outputSpeech.ssml,
        '<speak> Ich packe meinen Koffer und nehme mit. Plastikpalme und ' + newItem + ' </speak>'
      );
      done();
    });
});

it('Tells the user which items he has forgotten', function(done) {
    alexa.spoken('Ich packe meinen Koffer und nehme mit. {Plastikpalme}', function (error, payload) {
      const items = payload.sessionAttributes.items;
      const newItem = items[items.length -1];

      alexa.spoken('Ich packe meinen Koffer und nehme mit. {Plastikpalme} und {Kleinkram}', function (error, payload) {
        assert.equal(
          payload.response.outputSpeech.ssml,
          '<speak> Leider war das nicht richtig. Du hast ' + newItem + ' vergessen. Du hast damit verloren. </speak>'
        );
        done();
      });
    });
});

it('Tells the user which items were unneccessary', function(done) {
    alexa.spoken('Ich packe meinen Koffer und nehme mit. {Plastikpalme}', function (error, payload) {
      const items = payload.sessionAttributes.items;
      const newItem = items[items.length -1];

      alexa.spoken('Ich packe meinen Koffer und nehme mit. {Plastikpalme Kleinkram '+ newItem +'} und {Krimi}', function (error, payload) {
        assert.equal(
          payload.response.outputSpeech.ssml,
          '<speak> Leider war das nicht richtig. Kleinkram hat niemand eingepackt. Du hast damit verloren. </speak>'
        );
        done();
      });
    });
});