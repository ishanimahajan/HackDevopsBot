// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';

// import { config } from 'dotenv';
// const ENV_FILE = path.join(__dirname, '..', '.env');
// config({ path: ENV_FILE });

import * as restify from 'restify';
import { TwilioWhatsAppAdapter } from '@botbuildercommunity/adapter-twilio-whatsapp';
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter } from 'botbuilder';


// This bot's main dialog.
import { HackDevOpsBot } from './hack-bot';

// Create HTTP server.
const server = restify.createServer();
console.log("Starting bot server!!!");
server.listen(3979, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

//Create adapter.
//See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: 'e167ca8d-6c99-4984-aa86-16737b73d4cf',
    appPassword: 'VW.o-W1y9N~8tFy-.yO_pTHkPSo15g3Glm'
});


const whatsAppAdapter = new TwilioWhatsAppAdapter({
    accountSid: 'AC54f3390433d164ae8cd84341e1116f18', // Account SID
    authToken: '609a1b5549b7f046f62032c157bbe835', // Auth Token
    phoneNumber: 'whatsapp:+14155238886', // The From parameter consisting of whatsapp: followed by the sending WhatsApp number (using E.164 formatting)
    endpointUrl: 'https://ee979160a216.ngrok.io/api/messages' // Endpoint URL you configured in the sandbox, used for validation
});


// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create the main dialog.
const myBot = new HackDevOpsBot();
server.get('/hello', (req, res) => {
    res.send("Hello World");
})


// // Listen for incoming requests.
// server.post('/api/messages', (req, res) => {
//     console.log("Message rcvd!!");
//     adapter.processActivity(req, res, async (context) => {
//         await myBot.run(context);
//     });
// });

// WhatsApp endpoint for Twilio
server.post('/api/messages', (req, res) => {
    whatsAppAdapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
    });
});
