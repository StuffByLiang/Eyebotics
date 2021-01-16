import "regenerator-runtime/runtime";
import axios from "axios";

window.playAudio = async (text) => {
  let res = await axios.post(`/audio`, {
    text,
  });
  var audio = new Audio(`./output.mp3?timestamp=${new Date().getTime()}`);
  audio.play();
};

window.clicked = () => {
  window.playAudio($("#text").val());
};

window.recognizeAudio = () => {
  fetch("/api/speech-to-text/token")
    .then(function (response) {
      return response.json();
    })
    .then(function (token) {
      var stream = WatsonSpeech.SpeechToText.recognizeMicrophone(
        Object.assign(token, {
          outputElement: "#output", // CSS selector or DOM Element
        })
      );

      stream.on("error", function (err) {
        console.log(err);
      });

      window.stopStream = function () {
        stream.stop();
      };
    })
    .catch(function (error) {
      console.log(error);
    });
};
