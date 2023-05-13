//import * as elevenLabsAPI from "elevenlabs-api";
import fs from "fs";
import axios from "axios";

//var text = "This is a test";
var apiKey = process.env.ELEVEN_LABS_KEY;
var voice_id = process.env.ELEVEN_LABS_VOICE_ID;
var filename = "audio.mp3";

export const getAudioStream = async (text) => {
  try {
    return await elevenLabsAPI(apiKey, text, voice_id, filename);
    //console.log(`Success, Audio saved as: ${filename}`);
  } catch (error) {
    console.error(
      `An error occurred while converting text to speech: ${error}`
    );
  }

  //If you need stream
  /*
  const fs = require("fs");

  const stream = fs.createReadStream(filename);

  stream.pipe(process.stdout);*/
};

const elevenLabsAPI = async (apiKey, text, voice_id, file_name) => {
  try {
    var voice =
      "https://api.elevenlabs.io/v1/text-to-speech/" + voice_id + "/stream";
    const response = await axios({
      method: "post",
      url: voice,
      data: { text },
      headers: {
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      responseType: "stream",
    });
    return response;
    //response.data.pipe(fs.createWriteStream(file_name));
  } catch (error) {
    console.error(error);
  }
};
