import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { TurnContext, MessageFactory } from 'botbuilder';
import axios from 'axios';
import fs from 'fs';
import request from 'request';
//import axios from 'axios';


export class SpeechToText {

    async convertspeechToTextWithRestAPI(uniqueKey: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var url = 'https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US';
            var header2 = {
                'Ocp-Apim-Subscription-Key': 'e5de30b9ee4b488592f5b758c7d5a0f3',
                'Content-type': 'audio/ogg; codecs=opus',
                'Expect': '100-continue',
                'Accept': 'application/json'
            }

            var speechRequestData = {
                url: url,
                headers: header2
            };

            var fileName = "salini-test_" + uniqueKey + ".ogg"
            fs.createReadStream(fileName).pipe(request.post(speechRequestData, function (error, response, body) {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(body);
                } else {

                    console.log("Body is " + JSON.stringify(body));
                    fs.unlink(fileName, (err) => { });
                    resolve(JSON.parse(body).DisplayText);
                    // resolve(JSON.parse(body).header.name);
                }
            }));
        })
    }

    async convertSpeechToText(audioStream: sdk.PushAudioInputStream, callback: any): Promise<string> {

        return new Promise((resolve, reject) => {
            // now create the audio-config pointing to our stream and
            // the speech config specifying the language.
            // this.callback = callback;
            var audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);
            // CongnitiveService Name: HackBot-Speech
            var speechConfig = sdk.SpeechConfig.fromSubscription('e5de30b9ee4b488592f5b758c7d5a0f3', 'eastus');

            // setting the recognition language to English.
            speechConfig.speechRecognitionLanguage = 'en-US';

            // create the speech recognizer.
            var reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            reco.recognizing = function (s, e) {
                var str = "(recognizing) Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text;
                console.log(str);
            }

            reco.recognized = function (s, e) {
                // Indicates that recognizable speech was not detected, and that recognition is done.
                if (e.result.reason === sdk.ResultReason.NoMatch) {
                    var noMatchDetail = sdk.NoMatchDetails.fromResult(e.result);
                    console.log("\r\n(recognized)  Reason: " + sdk.ResultReason[e.result.reason] + " NoMatchReason: " + sdk.NoMatchReason[noMatchDetail.reason]);
                } else {
                    console.log("\r\n(recognized)  Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text);

                }
            };

            reco.sessionStarted = function (s, e) {
                var str = "(sessionStarted) SessionId: " + e.sessionId;
                console.log(str);
            };

            // Signals the end of a session with the speech service.
            reco.sessionStopped = function (s, e) {
                var str = "(sessionStopped) SessionId: " + e.sessionId;
                console.log(str);
            };

            // Signals that the speech service has started to detect speech.
            reco.speechStartDetected = function (s, e) {
                var str = "(speechStartDetected) SessionId: " + e.sessionId;
                console.log(str);
            };

            // Signals that the speech service has detected that speech has stopped.
            reco.speechEndDetected = function (s, e) {
                var str = "(speechEndDetected) SessionId: " + e.sessionId;
                console.log(str);
            };


            reco.recognizeOnceAsync(
                async function (result) {
                    console.log("Final text is: " + result.text);
                    reco.close();
                    resolve(result.text);
                    // callback(result.text);
                    //  context.sendActivity((MessageFactory.text(result.text, result.text)))
                    reco = undefined;
                },
                function (err) {
                    console.log("Error detected!" + JSON.stringify(err));
                    reco.close();
                    reco = undefined;
                    reject(err);
                });
        })

    }
}


