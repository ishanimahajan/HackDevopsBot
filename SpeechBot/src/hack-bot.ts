import http from 'http';
import fs from 'fs';
import CloudConvert from 'cloudconvert';
import axios from 'axios';
import { ActivityHandler, MessageFactory, TurnContext, Attachment, BotHandler } from 'botbuilder';
import * as needle from 'needle';
import { SpeechToText } from './speech-service';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { PushAudioInputStream } from 'microsoft-cognitiveservices-speech-sdk';
import { CreateWorkItem } from './workItemInfo';
import toWav from 'audiobuffer-to-wav';
import xhr from 'xhr';
export class HackDevOpsBot extends ActivityHandler {
//const uuidv4 = require("uuid/v4")

export class HackDevOpsBot extends ActivityHandler {

    private context: TurnContext;
    private next: () => Promise<void>;
    private _speechToTextConversionCompleted: boolean;
    private _prevReply: string;
    constructor() {
        super();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(this.onMessageHandler.bind(this));

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
        //await CreateWorkItem("creating sample task");
       await this.getAudioStreamFromMessage(context);

        await next();
    }

    hasAudioAttachement(context: TurnContext): boolean {
        if (context.activity.attachments && context.activity.attachments.length > 0 && (context.activity.attachments[0].contentType == 'audio/wav'
            || context.activity.attachments[0].contentType == 'application/octet-stream' || context.activity.attachments[0].contentType == 'audio/mpeg' ||
            context.activity.attachments[0].contentType == 'audio/ogg')) {
            console.log("audio file received");
            return true;
        }
        console.log("Content type: " + context.activity.attachments[0].contentType);
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
            console.log('Audio attachment details: ' + JSON.stringify(audioAttachement));

            // generate unique-key
            var uniqueKey = Math.floor(Math.random() * 100) + "";

            await this.saveOggFileInServer(contentUrl, uniqueKey);
            var speechService = new SpeechToText();



            var text = await speechService.convertspeechToTextWithRestAPI(uniqueKey);
            if (!text) {
                text = "Hello world";
            }
            await context.sendActivity(MessageFactory.text(text, text));
            // await self.context.sendActivity(MessageFactory.text("Task Submitted. You will receive notification once done!", "Task Submitted"));
        }
        else {
            await self.context.sendActivity(MessageFactory.text(this._prevReply, this._prevReply));
        }


        // while (!this._speechToTextConversionCompleted);

    }

    async saveOggFileInServer(contenturl: string, uniqueKey: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log("ContentUrl is: " + contenturl);
            const file = fs.createWriteStream("salini-test_" + uniqueKey + ".ogg");

            const response = await axios.get(contenturl, { responseType: 'stream' });
            (<any>response.data).pipe(file);

            file.on('finish', function () {
                file.close();  // close() is async, call cb after close completes.
                resolve();
            });

        });
    }

    async readAudioStream(readableStream: NodeJS.ReadableStream): Promise<PushAudioInputStream> {
        return new Promise((resolve, reject) => {

            var pushStream = sdk.AudioInputStream.createPushStream();
            //  var audioContext = new AudioContext();
            readableStream.on('data', async function (arrayBuffer) {
                console.log("I am here");
                console.log("Keys " + Object.keys(arrayBuffer));
                pushStream.write(arrayBuffer.value);
                // console.log("Content type: " + Object.keys(arrayBuffer));
            }).on('end', async () => {
                pushStream.close();
                resolve(pushStream);
            });
        })
    }
}
