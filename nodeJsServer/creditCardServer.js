// Required Modules
var express = require('express');
var uuid = require('uuid');
var redis = require('redis');
var async = require('async');
var zschema = require('z-schema');
var luhn = require('luhn').luhn;

// Credit cards data
var storage = {};

// Create redis client
var redisClient = redis.createClient();

redisClient.on("error", function (err) {
	console.log(err);
});

// Create Express web server
var app = express();

app.post('/creditcard', function(request,response) {

	response.writeHead(200, {'Content-Type': 'application/json'});

	var receivedData = '';

	request.on('data', function (data) {
		receivedData += data;
	});

	request.on('end', function () {

		var cardNumberJson = JSON.parse(receivedData);

		// Validate input according to schema and luhn algorithm
		if (isValidInput(cardNumberJson, response)){

			var cardNumber = cardNumberJson["credit-card"];

			// Check if card already exists
			var cardFound = false;
			redisClient.keys('*', function (err, keys) {

				if (err) return console.log(err);

				async.each(keys,

					// For each key
					function (key, callback) {
						redisClient.get(key, function (err, reply) {
							if (reply == cardNumber) {
								cardFound = true;
							}
							// Finished with this key
							callback();
						});
					},

					// When all keys are checked
					function () {
						if (cardFound) {
							// It's a known credit card
							console.log("Card already exists");
							response.write("This card already exists!");
							response.end();
						}
						else {
							// It's a new credit card

							// Compute a UUID for the card
							var cardId = uuid.v4();

							// Save card
							console.log("Saving card with id = " + cardId);
							redisClient.set(cardId, cardNumber);

							// Build response
							var responseJson = {};
							responseJson.token = cardId;
							response.write(JSON.stringify(responseJson));
						}

						response.end();
					});
			});
		}
	});
});

app.get('/creditcard/:id', function(request,response){

	var cardId = request.params.id;

	console.log("Requested for card with id = " + cardId);

	response.writeHead(200, {'Content-Type': 'application/json'});

	redisClient.exists(cardId, function(err,reply){
		if (reply == 1){
			// Card exists
			redisClient.get(cardId, function(err, reply){
				var cardNumber = reply;
				console.log("Card found. CardNumber = " + cardNumber);

				// Build response
				var responseJson = {};
				responseJson["credit-card"] = cardNumber;
				response.write(JSON.stringify(responseJson));
				response.end();
			});
		}
		else{
			// Card does not exist
			console.log("Card was not found");
			response.write("There is no card with this id!");
			response.end();
		}
	});
});

/*
 * Validates given input according to JSON schema and luhn algorithm
 */
var isValidInput = function(receivedData, response){

	var validator = new zschema();

	var schema = {
		type: "object",
		properties: {
			"credit-card": { type: "string" }
		},
		required: ["credit-card"]
	};

	// Validate JSon schema
	if (!validator.validate(receivedData,schema)){
		// Invalid schema
		console.log("Invalid input: " + JSON.stringify(receivedData));
		response.write("Invalid input. Usage: {'credit-card': <number> }");
		response.end();
		return false;
	}
	else {
		// Schema is valid, check credit card number according to luhn
		var cardNumber = receivedData["credit-card"];
		console.log("Request to save card with number = " + cardNumber);

		if (!luhn.validate(cardNumber)) {
			// Non valid number
			console.log("Invalid card number according to luhn algorithm: " + cardNumber);
			response.write("Invalid card number according to luhn algorithm");
			response.end();
			return false;
		}

		// Everything is ok
		return true;
	}
};

app.listen(8081);

console.log('listening on port 8081');
