import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

export const sendPrompt = async (messages) => {
  try {
    const resp = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 2048,
    });

    console.log(resp.data.choices[0].message.content);
    return resp.data.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return error?.response.data.error.message || "Something went wrong.";
  }
};
