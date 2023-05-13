import { TNL } from "tnl-midjourney-api";
import axios from "axios";

const TNL_API_KEY = process.env.NEXTLEG_MJ_KEY;
const tnl = new TNL(TNL_API_KEY);

export const requestImagine = async (prompt, ref = "") => {
  try {
    const response = await tnl.imagine(prompt, ref);
    console.log(response);
    return response;
  } catch (error) {
    console.error(
      `An error occurred while trying to make an image request: ${error}`
    );
  }

  return -1;
};

export const requestUpscale = async (buttonId, ref = "") => {
  try {
    console.log(buttonId + "  " + ref);
    //prettier-ignore
    //const response = await tnl.button("U1", "lBlGWJXFPkPJoWO5pfOO", ref);
    const response = await buttonSend(buttonId, ref);
    return response;
  } catch (error) {
    console.error(
      `An error occurred while trying to make an image request: ${error}`
    );
  }
  return -1;
};

const buttonSend = async (buttonId, ref = "") => {
  var data = JSON.stringify({
    button: "U1",
    buttonMessageId: buttonId,
    ref: ref,
  });

  var config = {
    method: "post",
    url: "https://api.thenextleg.io/v2/button",
    headers: {
      Authorization: "Bearer " + TNL_API_KEY,
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return error;
    });
};
