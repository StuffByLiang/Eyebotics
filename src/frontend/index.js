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
