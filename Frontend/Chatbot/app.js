const dialogflow = require('dialogflow');
const uuid = require('uuid');
const express = require('express');
const admin = require('firebase-admin')
const bodyParser = require('body-parser');
const serviceAccount = require('./chatbotspardha-qvdowa-firebase-adminsdk-7maux-b76ffd538d.json');
const app = express();

var currentIntent;
var sessions = [];

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://chatbotspardha-qvdowa.firebaseio.com/'
});


app.use(bodyParser.urlencoded({
	extended: false
}))


app.use(function (request, response, next) {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	response.setHeader('Access-Control-Allow-Credentials', true);
	next();
});


app.use(express.static('public'));


app.post('/id', (request, response) => {
	const dialogflowId = uuid.v4();
	sessions.push(dialogflowId);
	response.send({ sessionId: dialogflowId });
});


app.post('/send-msg', async(request, response) => {
	try {
		const result = await dialogflowGateway(request.body.ID, request.body.MSG);
		
		let messages = [];
		for (let i = 0; i < result.length; i++) {
			const message = result[i].text.text[0]
			messages.push(message);
		}

		if (currentIntent.includes('|')) {
			const intent_1 = currentIntent.split(" - ")
			const intent_2 = intent_1[1].split("|")

			const list = await firebaseCall(intent_2[0], intent_2[1]);
			const dict_message = { id: request.body.ID, intent: currentIntent, message: messages, extras: list };
			response.send({ Reply: dict_message });
		}
		else {
			const dict_message = { id: request.body.ID, intent: currentIntent, message: messages };
			response.send({ Reply: dict_message });
		}
	}
	catch (error) {
		console.log(error);
	}
});


async function dialogflowGateway(id, message) {
	const sessionClient = new dialogflow.SessionsClient({
		keyFilename: __dirname + "/ChatbotSpardha-7670a67c0787.json"
	});
	const sessionPath = sessionClient.sessionPath('chatbotspardha-qvdowa', id);
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				text: message,
				languageCode: 'en-US',
			},
		},
	};
	try {
		if (sessions.includes(id)) {
			const responses = await sessionClient.detectIntent(request);
			const result = responses[0].queryResult.fulfillmentMessages;
			currentIntent = responses[0].queryResult.intent.displayName;
			return result;
		}
		else {
			console.log('No session.');
		}
	}
	catch (error) {
		console.error();
	}
}


async function firebaseCall(parent, child) {
	try {
		let extras = [];
		const snapshot = await admin.database().ref(parent).once('value');
		const snapshot_1 = snapshot.child(child);
		for (let key in snapshot_1.val()) {
			extras.push(key);
		}
		return extras;
	}
	catch (error) {
		console.log(error);
	}
}


app.listen(3000);
