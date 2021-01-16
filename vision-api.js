const vision = require('@google-cloud/vision');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

var player = require('play-sound')(opts = {})


// IMAGE TO TEXT
const client = new vision.ImageAnnotatorClient();

async function detectText(imgpath) {
    try {

        const fileName = imgpath;

        // Performs text detection on the local file
        const [result] = await client.textDetection(fileName);
        const detections = result.textAnnotations;
        console.log('Text:');
        // detections.forEach(text => console.log(text));
        console.log(detections[0]["description"]);
        quickStart(detections[0]["description"]);
        // return detections[0]["description"];
    } catch (err) {
        console.log(err)
    }

}

// TEXT TO AUDIO
const client2 = new textToSpeech.TextToSpeechClient();

async function quickStart(textSpeak) {
    // The text to synthesize
    const text = textSpeak;

    // Construct the request
    const request = {
        input: { text: text },
        // Select the language and SSML voice gender (optional)
        voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
        // select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' },
    };

    // Performs the text-to-speech request
    const [response] = await client2.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');
    console.log('Audio content written to file: output.mp3');
    player.play('output.mp3', function (err) {
        if (err) throw (err)
    })

}


detectText('./sample_imgs/sample_img1.jpg');
