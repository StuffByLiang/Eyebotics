const vision = require("@google-cloud/vision");

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function getDataFromImage(base64) {
  var base64Data = base64.replace(/^data:image\/png;base64,/, "");

  require("fs").writeFile(
    "./dist/image.jpg",
    base64Data,
    "base64",
    function (err) {
      console.log(err);
    }
  );

  // Performs label detection on the image file
  const [result] = await client.annotateImage({
    image: {
      source: { filename: "./dist/image.jpg" },
    },
    features: [
      { type: "TEXT_DETECTION" },
      { type: "DOCUMENT_TEXT_DETECTION" },
      { type: "OBJECT_LOCALIZATION" },
    ],
  });
  // console.log(result);
  // const labels = result.labelAnnotations;
  // console.log("Labels:");
  // labels.forEach((label) => console.log(label.description));

  const {
    fullTextAnnotation,
    localizedObjectAnnotations,
    textAnnotations,
  } = result;

  return { fullTextAnnotation, localizedObjectAnnotations, textAnnotations };
}

module.exports = {
  getDataFromImage,
};
