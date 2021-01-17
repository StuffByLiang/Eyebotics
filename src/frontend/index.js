import "regenerator-runtime/runtime";
import axios from "axios";

window.commands = [];

const addCommand = (text, callback) => {
  window.commands.push([text, callback]);
};

/*

example:

when we say hi, the console will log that we said hi

addCommand('hi', ()=>{
    console.log('we said hi!!')
});

*/

const playAudio = async (text) => {
  let res = await axios.post(`/audio`, {
    text,
  });
  var audio = new Audio(`./output.mp3?timestamp=${new Date().getTime()}`);
  audio.play();
};

const clicked = () => {
  playAudio($("#text").val());
};

const recognizeAudio = () => {
  fetch("/api/speech-to-text/token")
    .then(function (response) {
      return response.json();
    })
    .then(function (token) {
      var stream = WatsonSpeech.SpeechToText.recognizeMicrophone(
        Object.assign(token, {
          objectMode: false,
        })
      );
      stream.setEncoding("utf8");

      stream.on("data", function (data) {
        console.log(data);
        $("#output").html(data);
        for (let [text, callback] of window.commands) {
          if (data.toLowerCase().includes(text)) {
            callback();
            break;
          }
        }
      });

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

window.clicked = clicked;
window.recognizeAudio = recognizeAudio;
window.addCommand = addCommand;

const video = document.getElementById("video");
window.video = video;
let labeledFaceDescriptors;
let faceMatcher;

const getDataFromImage = async () => {
  let res = await axios.post(`/image`, {
    image: getScreenshot(window.video),
  });

  console.log(res);

  return res;
};

window.getDataFromImage = getDataFromImage;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
]).then(startVideo);

function loadLabeledImages() {
  const labels = [
    "Black Widow",
    "Captain America",
    "Captain Marvel",
    "Hawkeye",
    "Jim Rhodes",
    "Thor",
    "Tony Stark",
  ];
  return Promise.all(
    labels.map(async (label) => {
      const description = [];
      for (let i = 1; i <= 2; i++) {
        // is 2 because there are two images so far of every single character; the more you have, the more accurate it will be
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/StuffByLiang/hack-the-north/facial-recognition/facial%20recognition/labeled_images/${label}/${i}.jpg`
        ); // must be hosted on a live website (live server doesn't work for this) for fetchImage()
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        description.push(detections.descriptor); // what describes the face that was detected inside each one of our images
      }

      return new faceapi.LabeledFaceDescriptors(label, description);
    })
  );
}

/**
 * Takes a screenshot from video.
 * @param videoEl {Element} Video element
 * @param scale {Number} Screenshot scale (default = 1)
 * @returns {string} image base64
 */
function getScreenshot(videoEl, scale) {
  scale = scale || 1;

  const canvas = document.createElement("canvas");
  canvas.width = videoEl.clientWidth * scale;
  canvas.height = videoEl.clientHeight * scale;
  canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL();
}

window.getScreenshot = getScreenshot;

async function startVideo() {
  labeledFaceDescriptors = await loadLabeledImages();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

let getFaceInfo;

const startRecognition = () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById("video-container").append(canvas);
  window.canvas = canvas;
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  getFaceInfo = async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((face) =>
      faceMatcher.findBestMatch(face.descriptor)
    );

    return results.map((face, i) => {
      const result = resizedDetections[i];
      console.log(face);

      let expressionsList = Object.keys(result.expressions).map((key) => [
        key,
        result.expressions[key],
      ]);

      expressionList = expressionsList.filter(
        (expression) => expression[1] >= 0.1
      );

      return {
        age: result.age,
        gender: result.gender,
        expressions: expressionList,
        label: face._label,
      };
    });
  };

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (resizedDetections.length != 0) {
      const {
        age,
        gender,
        genderProbability,
        detection,
      } = resizedDetections[0];
      new faceapi.draw.DrawTextField(
        [
          `${faceapi.utils.round(age, 0)} years`,
          `${gender} (${faceapi.utils.round(genderProbability)})`,
        ],
        detection.box.bottomRight
      ).draw(canvas);
    }

    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);
    });
  }, 100);
};

window.startRecognition = startRecognition;
