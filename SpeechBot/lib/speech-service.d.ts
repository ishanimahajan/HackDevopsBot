import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
export declare class SpeechToText {
    convertspeechToTextWithRestAPI(uniqueKey: string): Promise<string>;
    convertSpeechToText(audioStream: sdk.PushAudioInputStream, callback: any): Promise<string>;
}
