import "regenerator-runtime/runtime";
import axios from "axios";

window.commands = [];
const pages = ["#listening", "#debug"];

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

  return res.data;
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
    "Liang",
    "Emily",
    "Charles",
    "Annie",
    "Adrian",
    "Amogh",
    "Anindya",
  ];
  return Promise.all(
    labels.map(async (label) => {
      const description = [];
      for (let i = 1; i <= 2; i++) {
        // is 2 because there are two images so far of every single character; the more you have, the more accurate it will be
        const img = await faceapi.fetchImage(`./images/${label}/${i}.jpg`); // must be hosted on a live website (live server doesn't work for this) for fetchImage()
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        description.push(detections.descriptor); // what describes the face that was detected inside each one of our images
      }

      return new faceapi.LabeledFaceDescriptors(label, description);
      // description is in an array with their, gender, facial expression
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
  recognizeAudio();
  switchPage("#listening");
  $("#loading").hide();
  pages.forEach((p) => {
    $(p).show();
    $(p).show();
  });
}

let getFaceInfo;
window.getFaceInfo = getFaceInfo;
let canvas;
let displaySize;

video.addEventListener("play", () => {
  canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById("video-container").append(canvas);
  window.canvas = canvas;
  displaySize = { width: video.width, height: video.height };
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

      expressionsList = expressionsList.filter(
        (expression) => expression[1] >= 0.1
      );

      return {
        age: result.age,
        gender: result.gender,
        expressions: expressionsList,
        label: face._label,
      };
    });
  };
});

/*
{
  fullTextAnnotation: null
localizedObjectAnnotations: (4) [{…}, {…}, {…}, {…}]
// when you take screenshot, you save each object as an array
textAnnotations
}
*/

// userstory 1: user asks what text is on the screen -> siri reads taht shit to us
addCommand("text", async () => {
  playAudio("got it"); // plays audio
  let data = await getDataFromImage(); // => {}
  if (data.fullTextAnnotation === null) {
    playAudio(`No identifiable text found`);
  } else {
    let text = data.fullTextAnnotation.text;
    playAudio(`We found ${text || ""}`);
  }
});

// // user story2: recognizing objects
addCommand("object", async () => {
  let data = await getDataFromImage();
  let listOfItems = data.localizedObjectAnnotations;
  if (listOfItems.length === 0) {
    await playAudio("No identifiable object found");
  } else {
    let string = "The objects that are present are as follows: ";
    for (let item of listOfItems) {
      ///let position = ... TODO:
      const position = getPosition(
        item.boundingPoly.normalizedVertices[0],
        item.boundingPoly.normalizedVertices[1],
        item.boundingPoly.normalizedVertices[2],
        item.boundingPoly.normalizedVertices[3]
      );

      console.log(position);

      string += `${item.name} is at the ${position}, `;
    }
    await playAudio(string);
  }
});

// given 4 vertices return the position as a string (top left/right, bottom left/right)
function getPosition(v1, v2, v3, v4) {
  // 0 < v1.x v1.y < 1
  // 0, 0 is top left corner x = 1 y =1 is bottom right corner
  //finding the center

  var xcoor = v1.x + (v2.x - v1.x) / 2;
  var ycoor = v1.y + (v3.y - v1.y) / 2;

  if (xcoor > 0.5 && ycoor > 0.5) {
    return "bottom right";
  } else if (xcoor > 0.5 && ycoor < 0.5) {
    return "top right";
  } else if (xcoor < 0.5 && ycoor < 0.5) {
    return "top left";
  } else if (xcoor < 0.5 && ycoor < 0.5) {
    return "bottom left";
  } else {
    return "middle of screen";
  }
}

window.getFaceInfo = getFaceInfo;

// user story 3: recognizing the faces of the people

// userstory 1: user asks what text is on the screen -> siri reads taht shit to us
addCommand("person", async () => {
  await playAudio("got it"); // plays audio
  let data = await getFaceInfo(); // => []
  console.log(data);
  if (data.length == 0) {
    await playAudio("There are no people in sight.");
  } else {
    let string = "";
    for (let i = 0; i < data.length; i++) {
      var str_expressions = "";

      // ...data[i].label -> name of the person or 'unknown'
      if (data[i].label == undefined) {
        break;
      }
      for (let j = 0; j < data[i].expressions.length; j++) {
        str_expressions = data[i].expressions[j][0] + ", ";
        if (j - 2 == data[i].expressions.length) {
          str_expressions = str_expressions + " and ";
        }
      }

      string += `The person in screen is ${data[i].label}, a ${Math.round(
        data[i].age
      )} year old ${data[i].gender} currently feeling ${str_expressions} `;
    }
    await playAudio(string);
  }

  // if (data.fullTextAnnotation === null) {
  //   playAudio(`No identifiable text found`);
  // } else {
  //   let text = data.fullTextAnnotation.text;
  //   playAudio(`We found ${text || ""}`);
  // }
});

addCommand("bug", async () => {
  switchPage("#debug");
});

addCommand("normal", async () => {
  switchPage("#listening");
});

addCommand("for people", async () => {
  await playAudio("Scanning for people");
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
});

const switchPage = (page) => {
  pages.forEach((p) => {
    $(p).css("visibility", "hidden");
    $(p).css("position", "absolute");
  });
  $(page).css("visibility", "visible");
  $(page).css("position", "relative");
};

pages.forEach((p) => {
  $(p).hide();
});

window.switchPage = switchPage;
