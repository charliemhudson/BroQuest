import * as uuid from "uuid";
import { sendPrompt } from "@broquest/core/src/open-ai";

export const initQuest = (userId, data) => {
  let quest = {
    // The attributes of the item to be created
    state: "ready",
    userId: userId.toString(),
    questId: uuid.v1(), // A unique uuid
    title: data.title,
    genre: data.genre,
    additionalDetails: data.additionalDetails,
    chapters: [
      {
        text: "Chapter 1",
        chapterNumber: 1,
        storySoFar: "No story to summarise yet.",
        charactersTurn: "",
      },
    ],
    characters: data.characters,
    playerCount: data.playerCount,
    isFinished: false,
    latestSummary: "",
    charactersTurn: 0,
    turnsPlayed: 0,
    telegramChatId: data.telegramChatId,
    questionIndex: 0,
    userTurn: 0,
    players: data.players,
    answers: {},

    createdAt: Date.now(), // Current Unix timestamp
  };
  return quest;
};

export const summariseStorySoFar = async (quest) => {
  const characterDescriptions = quest.players
    .map((player, index) => {
      return (
        `\nCharacter Name: ${player.characterName}` +
        `\nCharacter Description: ${player.characterDescription}`
      );
    })
    .join("\n\n");
  const lastChapter = quest.chapters[quest.chapters.length - 1];
  const storySoFar = lastChapter.storySoFar;
  const text = lastChapter.text;
  const summary = await sendPrompt([
    {
      role: "system",
      content:
        "You are going to summarise the story so far in no more than 1000 characters. You will combine the previous summary of the story so far, the protagonist characters in the story and the new chapter to provide a new summary of the story so far to replace the previous one. This is the previous summary of the story so far: " +
        storySoFar +
        `\n\n This is a description of the characters, in order from when they will take their turns - ${characterDescriptions}` +
        ". This is the new chapter: '" +
        text +
        ".'",
    },
  ]);

  return summary;
};

export const generateFirstChapter = async (questDetails) => {
  const characterDescriptions = questDetails.players
    .map((player, index) => {
      return (
        `Player ${index + 1} character description:` +
        `\nCharacter Name: ${player.characterName}` +
        `\nCharacter Description: ${player.characterDescription}`
      );
    })
    .join("\n\n");

  return sendPrompt([
    {
      role: "system",
      content:
        "You are a dungeon master guiding and narrating a story in the style of Terry Pratchett's writing. We are going to have " +
        questDetails.players.length +
        " players interacting with you representing the two protagonists characters in the story. They will be taking turns in the story by providing prompts representing actions their character takes in the story. " +
        ". You will generate the first chapter in the story. The first line with the be the title 'Chapter 1'. Start the story by introducing the characters and the plot but do not mention that this is a dungeons and dragons game." +
        " You will end the chapter by leaving a decision open for the first player. At the end of the chapter, you will then break the fourth wall and ask the first player, referring to them by their character name, to take their turn in the story by inputing an action - in bold markup and no speechmarks. This will be in the form '{character 1 name}, what do you do next?' " +
        `\n\n This is a description of the characters, in order from when they will take their turns - ${characterDescriptions}` +
        `\n\nThe story is called: ${questDetails.title}` +
        `.\nThis is the genre of the story: ${questDetails.genre}` +
        `.\nThese are some details to include in the story: ${questDetails.additionalDetails}`,
    },
  ]);
};

export const generateNextChapter = async (questDetails, turnTaken) => {
  const characterDescriptions = questDetails.players
    .map((player, index) => {
      return (
        `Player ${index + 1} character description:` +
        `\nCharacter Name: ${player.characterName}` +
        `\nCharacter Description: ${player.characterDescription}`
      );
    })
    .join("\n\n");
  const storySoFar =
    questDetails.chapters[questDetails.chapters.length - 1].storySoFar;
  const charactersTurn =
    questDetails.players[questDetails.userTurn].characterName;
  //UPDATE THIS TO BE THE NEXT PLAYER
  const nextPlayer = questDetails.players[questDetails.userTurn].characterName;
  const currentChapter = questDetails.chapters.length;

  return sendPrompt([
    {
      role: "system",
      content:
        "You are a dungeon master guiding and narrating a story in the style of Terry Pratchett's writing. We have" +
        questDetails.players.length +
        " players interacting with you representing the protagonists characters in the story. They will be taking turns in the story by providing prompts representing actions their character takes in the story. The first line with the be the title 'Chapter " +
        currentChapter +
        ":'. You will then generate this next chapter of the story based on the story summary so far and the action that the current player has taken. " +
        " You will end the chapter by leaving a decision open for the next player. At the end of the chapter, you will then break the fourth wall and ask the next player, referring to them by their character name, to take their turn in the story by inputing an action - in bold markup and no speechmarks. This will be in the form '{character name} what do you do next?' " +
        ".\nThe currently chapter is" +
        currentChapter +
        ".\nThis is the story summary so far: " +
        storySoFar +
        `\n\n This is a description of the characters, in order from when they take their turns - ${characterDescriptions}` +
        ". The current characters turn is :" +
        charactersTurn +
        ".\nThis is the turn they have taken:" +
        turnTaken +
        ".\nYou will now generate the next chapter of the story and ask the next player for their turn. The next player is: " +
        nextPlayer,
    },
  ]);
};
