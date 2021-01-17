var express = require("express");
var router = express.Router();
var audio = require("../audio.js");
var vision = require("../vision.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* GET home page. */
router.post("/audio", async (req, res, next) => {
  const { text } = req.body;
  console.log(text);

  await audio.writeToAudioFile(text);

  res.send("okay");
});

router.post("/image", async (req, res, next) => {
  const { image } = req.body;

  let results = await vision.getDataFromImage(image);

  res.json(results);
});

module.exports = router;
