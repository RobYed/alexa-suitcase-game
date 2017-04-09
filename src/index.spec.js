var bst = require('bespoken-tools');
var assert = require('assert');

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
        // Check that the introduction is play as outputSpeech
        assert.equal(
          payload.response.outputSpeech.ssml, 
          '<speak> Schön, dass du mit mir spielen willst. Du fängst an, was nimmst du mit? </speak>'
        );
        done();
    });
});