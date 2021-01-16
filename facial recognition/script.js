const video = document.getElementById("video");
// const imageUpload = document.getElementById("imageUpload");
let labeledFaceDescriptors;
let faceMatcher;


Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
// ]).then(start).then(startVideo)
]).then(startVideo)

async function start() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    let canvas
    document.body.append('Loaded')
    imageUpload.addEventListener('change', async() => {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(imageUpload.files[0])

        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)
        const displaySize = { width: image.width, height: image.height }
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
        // document.body.append(detections.length)   // counts # of faces

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString()})
            drawBox.draw(canvas)

        })
    })
}

function loadLabeledImages() {
    const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
    return Promise.all(
        labels.map(async label => {
            const description = []
            for (let i = 1; i <=2; i++) {  // is 2 because there are two images so far of every single character; the more you have, the more accurate it will be
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/StuffByLiang/hack-the-north/facial-recognition/facial%20recognition/labeled_images/${label}/${i}.jpg`) // must be hosted on a live website (live server doesn't work for this) for fetchImage()
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                description.push(detections.descriptor)  // what describes the face that was detected inside each one of our images
            }

            return new faceapi.LabeledFaceDescriptors(label, description)
        })
    )
}

// function startVideo() {  // from before images were integrated with video
//   navigator.getUserMedia(
//     { video: {} },
//     (stream) => (video.srcObject = stream),
//     (err) => console.error(err)
//   );
// }

async function startVideo() {
    // const labeledFaceDescriptors = await loadLabeledImages()
    // const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    labeledFaceDescriptors = await loadLabeledImages()
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
   
    navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();
    console.log(detections);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    // console.log("resizedDetections:", resizedDetections);
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

    // const labeledFaceDescriptors = await loadLabeledImages()
    // const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    // document.body.append('Loaded')
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString()})
            drawBox.draw(canvas)

        })
  }, 100);
});
