var express = require('express');
var uuid = require('uuid');

// Credit cards data
var storage = {};

var app = express();

app.post('/creditcard', function(request,response) {

	response.writeHead(200, {'Content-Type': 'application/json'});

	var receivedData = '';

	request.on('data', function (data) {
		receivedData += data;
	});

	request.on('end', function () {

		// Get card number from JSON
		var cardNumberJson = JSON.parse(receivedData);
		var cardNumber = cardNumberJson["credit-card"];

		console.log("Request to save card with number = " + cardNumber);

		// Check if card already exists
		var cardFound = false;

		var cardIds = Object.keys(storage);
		cardIds.forEach(function (id){
			if (storage[id] == cardNumber) {
				cardFound = true;
			}
		});

		if (cardFound){
			// It's a known credit card
			console.log("Card already exists");
			response.write("This card already exists!");
		}
		else{
			// It's a new credit card

			// Compute a UUID for the card
			var cardId = uuid.v4();

			// Save card
			console.log("Saving card with id = " + cardId);
			storage[cardId] = cardNumber;

			// Build response
			var responseJson = {};
			responseJson.token = cardId;
			response.write(JSON.stringify(responseJson));
		}

		response.end();
	})
});

app.get('/creditcard/:id', function(request,response){

	var cardId = request.params.id;

	console.log("Requested for card with id = " + cardId);

	response.writeHead(200, {'Content-Type': 'application/json'});

	if (storage.hasOwnProperty(cardId)) {
		// Card exists

		var cardNumber = storage[cardId];
		console.log("Card found. CardNumber = " + cardNumber);

		// Build response
		var responseJson = {};
		responseJson["credit-card"] = cardNumber;
		response.write(JSON.stringify(responseJson));
	}
	else{
		// Card does not exist
		console.log("Card was not found");
		response.write("There is no card with this id!");
	}

	response.end();
});

app.listen(8081);

console.log('listening on port 8081');
