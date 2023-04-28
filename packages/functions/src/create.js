import { Table } from "sst/node/table";
import * as uuid from "uuid";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";
import { Configuration, OpenAIApi } from "openai";
import { Console } from "console";

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

const generateChapter = async (questDetails) => {
  console.log(configuration.apiKey);
  try {
    const aiResponse1 = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a dungeon master guiding and narrating a story in the style of Terry Pratchett's writing. We are going to have two players interacting with you representing the two protagonist characters in the story. They will be taking turns in the story by providing prompts representing actions their character takes in the story. " +
            ". Give an short introduction to the story and introduce the characters but do not mention that this is a dungeons and dragons game. At the end of the summary you will ask the first player, refering to them by their character name, to take their turn in the story by inputing an action." +
            "\nPlayer 1 character description:" +
            "\nName: " +
            questDetails.characters[0].name +
            "\n Description - " +
            questDetails.characters[0].description +
            ".\nPlayer 2 character description:" +
            "\nName: " +
            questDetails.characters[1].name +
            "\nDescription - " +
            questDetails.characters[1].description +
            ".\nThe story is called:" +
            questDetails.title +
            ".\nThis is the genre of the story:" +
            questDetails.genre +
            ".\nThese are some details to include in the story:" +
            questDetails.additionalDetails,
        },
        /*{
        role: "user",
        content:
          "I want you to be a dungeons and dragons master guiding and narrating a story in the style of Terry Pratchett's writing. We are going to have two players interacting with you representing the two protagonist characters in the story. They will be taking turns in the story by providing prompts representing actions their character takes in the story. " +
          ". Give an short introduction to the story and introduce the characters but do not mention that this is a dungeons and dragons game. At the end of the summary you will ask the first player, refering to them by their character name, to take their turn in the story by inputing an action." +
          "Player 1 character description:" +
          player1Prompt +
          ". Player 2 character description:" +
          player2Prompt +
          ". This is the genre of the story:" +
          genrePrompt +
          ". These are some details to include in the story:" +
          storydetailsPrompt,
      },*/
      ],
    });

    console.log(aiResponse1.data.choices[0].message.content);

    return aiResponse1.data.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return "SOMETHING WENT WRONG";
  }
};

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  let questDetails = {
    // The attributes of the item to be created
    userId: event.requestContext.authorizer.iam.cognitoIdentity.identityId,
    questId: uuid.v1(), // A unique uuid
    title: data.title,
    genre: data.genre,
    additionalDetails: data.additionalDetails,
    chapters: [
      {
        text: "Chapter 1",
        chapterNumber: 1,
        storySoFar: "No story summary so far.",
        charactersTurn: "",
      },
    ],
    characters: data.characters,
    playerCount: data.playerCount,
    isFinished: false,
    latestSummary: "",
    charactersTurn: 0,
    turnsPlayed: 0,

    createdAt: Date.now(), // Current Unix timestamp
  };

  const resp = await generateChapter(questDetails);

  questDetails.chapters[0].text = resp;

  console.log(questDetails);

  const params = {
    TableName: Table.Quest.tableName,
    Item: questDetails,
  };

  await dynamoDb.put(params);

  return params.Item;
});
