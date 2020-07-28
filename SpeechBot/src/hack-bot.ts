// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.
//var bufferToArrayBuffer = require('buffer-to-arraybuffer');

import { ActivityHandler, MessageFactory, TurnContext, Attachment, BotHandler } from 'botbuilder';
import * as needle from 'needle';
import { SpeechToText } from './speech-service';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { PushAudioInputStream } from 'microsoft-cognitiveservices-speech-sdk';
import { CreateWorkItem } from './workItemInfo';
export class HackDevOpsBot extends ActivityHandler {


    private context: TurnContext;
    private next: () => Promise<void>;
    private _speechToTextConversionCompleted: boolean;
    private _prevReply: string;
    constructor() {
        super();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(this.onMessageHandler.bind(this)
            // async (context, next) => {
            // if (this.hasAudioAttachement(context)) {

            // }
            // // const replyText = `Echo: ${context.activity.text}`;
            // // await context.sendActivity(MessageFactory.text(replyText, replyText));
            // // By calling next() you ensure that the next BotHandler is run.
            // await next();
            //}
        );

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async onMessageHandler(context: TurnContext, next) {
        //await this.getAudioStreamFromMessage(context)
        //await this.ConvertAudioToText(context);
        console.log("inside onMessageHandler: "+context.activity.text);
        this.context = context;
        this.next = next;
        await CreateWorkItem("creating sample task");
       // await this.getAudioStreamFromMessage(context);

        await next();
    }

    hasAudioAttachement(context: TurnContext): boolean {
        if (context.activity.attachments && context.activity.attachments.length > 0 && (context.activity.attachments[0].contentType == 'audio/wav'
            || context.activity.attachments[0].contentType == 'application/octet-stream')) {
            return true;
        }
        return false
    }

    async getAudioStreamFromMessage(context: TurnContext) {
        var self = this;
        this._speechToTextConversionCompleted = false
        if (this.hasAudioAttachement(context)) {
            console.log("Extract audio");
            const audioAttachement = context.activity.attachments[0];
            const contentUrl = audioAttachement.contentUrl;
            let headers = {};
            headers['Content-Type'] = audioAttachement.contentType;
            var readableStream = needle.get(contentUrl, { headers: headers });

            // var pushStream = sdk.AudioInputStream.createPushStream();

            // readableStream.on('data', async function (arrayBuffer) {

            //     pushStream.write(arrayBuffer.slice());

            // }).on('end', async () => {
            //     pushStream.close();
            //     console.log("Printing");

            //     var speechService = new SpeechToText();
            //     speechService.convertSpeechToText(pushStream, self.replyToBot.bind(self));

            //     //  callback(pushStream);
            // });
            var pushStream = await this.readAudioStream(readableStream)
            var speechService = new SpeechToText();
            var text = await speechService.convertSpeechToText(pushStream, self.replyToBot.bind(self));
            await context.sendActivity(MessageFactory.text(text, text));
            // await self.context.sendActivity(MessageFactory.text("Task Submitted. You will receive notification once done!", "Task Submitted"));
        }
        else {
            await self.context.sendActivity(MessageFactory.text(this._prevReply, this._prevReply));
        }


        // while (!this._speechToTextConversionCompleted);

    }

    async readAudioStream(readableStream: NodeJS.ReadableStream): Promise<PushAudioInputStream> {
        return new Promise((resolve, reject) => {
            var pushStream = sdk.AudioInputStream.createPushStream();
            readableStream.on('data', async function (arrayBuffer) {

                pushStream.write(arrayBuffer.slice());

            }).on('end', async () => {
                pushStream.close();
                // console.log("Printing");
                resolve(pushStream);
                //  callback(pushStream);
            });
        })
    }

    replyToBot(reply: string) {
        console.log("Bot reply " + reply);
        //this._prevReply = reply;
        // await this.context.sendActivity(MessageFactory.text(reply, reply));
        //await this.next();
    }
}
