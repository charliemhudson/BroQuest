import handler from "@broquest/core/handler";
import { Table } from "sst/node/table";
import { Bucket } from "sst/node/bucket";
import TelegramBot from "node-telegram-bot-api";
import dynamoDb from "@broquest/core/dynamodb";
import s3 from "@broquest/core/s3bucket";
import { getAudioStream } from "@broquest/core/elevenlabs";
import { requestImagine } from "@broquest/core/midjourney";
import { initQuest } from "@broquest/core/quest";
import getQuest from "./getQuest";
import saveQuest from "./saveQuest";
import deleteQuest from "./deleteQuest";

import {
  generateFirstChapter,
  summariseStorySoFar,
  generateNextChapter,
} from "@broquest/core/src/quest";

const NEW_QUEST_QUESTIONS = [
  "What is the name of your quest?",
  "What genre is your quest?",
  "Provide some additional information that the quest should include",
];
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

export const main = handler(async (event) => {
  //return { message: "ok" };
  const data = JSON.parse(event.body);
  if (!data.message) {
    return { message: "ok" };
  }
  const chatId = data.message.chat.id;
  const userId = data.message.from.id.toString();
  const from = data.message.from;
  const text = data.message.text;

  if (text.startsWith("/startnewquest")) {
    await handleStartCommand(chatId, from);
  } else if (text.startsWith("/taketurn")) {
    await handleTakeTurnCommand(chatId, userId, from, text);
  } else {
    await handleMessage(chatId, userId, from, text);
  }
  return { message: "ok" };
});

async function getGroupMemberCount(chatId) {
  try {
    // Get the number of members in the chat, -1 to exclude the bot
    const membersCount = (await bot.getChatMemberCount(chatId)) - 1;

    return membersCount;
  } catch (error) {
    console.error("Error getting chat members:", error);
  }
}

async function handleStartCommand(chatId, from) {
  const membersCount = await getGroupMemberCount(chatId);

  const data = {
    telegramChatId: chatId,
    state: "ready",
    userId: from.id.toString(),
    questionIndex: 0,
    userTurn: 0,
    players: [],
    playerCount: membersCount,
    answers: {},
  };
  const questDetails = initQuest(from.id, data);

  //delete the last run
  await deleteQuest(chatId, from.id.toString());
  //start new run
  await saveQuest(questDetails);
  bot.sendMessage(chatId, NEW_QUEST_QUESTIONS[0]);
}

async function handleTakeTurnCommand(chatId, userId, from, text) {
  if (text.split("/taketurn")[1].trim().length <= 1) {
    bot.sendMessage(chatId, "Please provide an instruction to take the turn");
    return;
  }

  const characterTurn = text.split("/taketurn")[1].trim();
  // Notify the user that the quest is being loaded

  const questDetails = await getQuest(chatId, userId);

  if (!questDetails) {
    console.log("No questDetails found for - " + chatId + " " + userId);
    return; // Ignore messages if no questDetails is found
  }

  if (questDetails.state === "processing") {
    return;
  }

  if (from.id != questDetails.players[questDetails.userTurn].userId) {
    bot.sendMessage(
      questDetails.telegramChatId,
      from.first_name + " it's not your turn."
    );
    return;
  }

  questDetails.state = "processing";
  saveQuest(questDetails);

  bot.sendMessage(questDetails.telegramChatId, "Loading next chapter...");

  // Call the function to generate the next chapter (replace with your actual function to generate the chapter text)
  const nextChapterText = await generateNextChapter(
    questDetails,
    characterTurn
  );

  // Add the generated chapter to the chapters array
  const newChapter = {
    text: nextChapterText,
    chapterNumber: questDetails.chapters.length + 1,
    storySoFar: "",
    charactersTurn: characterTurn,
  };

  // Send the next chapter to the chat
  bot.sendMessage(questDetails.telegramChatId, nextChapterText);
  // Save the questDetails
  await saveQuest(questDetails);

  // Update the story so far summary so it can be used to generate new chapters
  newChapter.storySoFar = await summariseStorySoFar(questDetails);
  questDetails.chapters.push(newChapter);
  // Save the questDetails again
  await saveQuest(questDetails);

  // Notify the user that the audio is being generated
  bot.sendMessage(questDetails.telegramChatId, "Generating audio...");
  const audio = await generateChapterAudio(
    questDetails,
    questDetails.chapters.length
  );
  bot.sendAudio(questDetails.telegramChatId, audio, {
    title: "Chapter " + questDetails.chapters.length,
  });
  questDetails.state = "ready";
  await saveQuest(questDetails);
}

async function handleMessage(chatId, userId, from, text) {
  const questDetails = await getQuest(chatId, userId);
  if (!questDetails) {
    console.log("No questDetails found for - " + chatId + " " + userId);
    return; // Ignore messages if no questDetails is found
  }

  if (questDetails.state === "processing") {
    return;
  }

  questDetails.state = "processing";
  await saveQuest(questDetails);

  const questionIndex = questDetails.questionIndex;

  if (questionIndex < 3) {
    questDetails.answers[NEW_QUEST_QUESTIONS[questionIndex]] = text;
    if (questionIndex === 0) {
      questDetails.title = text;
    } else if (questionIndex === 1) {
      questDetails.genre = text;
    } else if (questionIndex === 2) {
      questDetails.additionalInfo = text;
    }

    //setup the first player who will be giving details on their character
    if (questionIndex === NEW_QUEST_QUESTIONS.length - 1) {
      questDetails.players.push({ userId, userName: from.first_name });
    }
    console.log(NEW_QUEST_QUESTIONS.length);
    //either move to the next question or once finished, ask the first player to provide details on their character
    if (questionIndex + 1 < NEW_QUEST_QUESTIONS.length) {
      questDetails.questionIndex++;
      bot.sendMessage(chatId, NEW_QUEST_QUESTIONS[questDetails.questionIndex]);
    } else {
      questDetails.questionIndex++;
      bot.sendMessage(
        chatId,
        `${
          questDetails.players[questDetails.userTurn].userName
        }, what is your character's name?`
      );
    }
  } else {
    if (userId === questDetails.players[questDetails.userTurn].userId) {
      if (questionIndex === 3) {
        questDetails.players[questDetails.userTurn].characterName = text;
        questDetails.questionIndex++;
        bot.sendMessage(
          chatId,
          `${
            questDetails.players[questDetails.userTurn].userName
          }, tell us a bit more about your character - ${text}`
        );
      } else if (questionIndex === 4) {
        questDetails.players[questDetails.userTurn].characterDescription = text;

        bot.sendMessage(
          questDetails.telegramChatId,
          "Generating character image..."
        );

        await requestImagine(
          "An digital fantasy art caricature portrait of a character with the following name - " +
            questDetails.players[questDetails.userTurn].characterName +
            " and description - " +
            questDetails.players[questDetails.userTurn].characterDescription +
            "  , the type of the painting will be in line with the story genre which is - " +
            questDetails.genre +
            " --v 5",
          questDetails.telegramChatId.toString() + "-img"
        );

        if (questDetails.userTurn + 1 < questDetails.players.length) {
          questDetails.userTurn++;
          questDetails.questionIndex = 3;
          bot.sendMessage(
            chatId,
            `${
              questDetails.players[questDetails.userTurn].userName
            }, what is your character's name?`
          );
        } else {
          questDetails.questionIndex++;
          bot.sendMessage(
            chatId,
            "All players have provided their character information. Let the quest begin!"
          );
          // Save quest and character data, and reset the questDetails
          await startQuest(questDetails);
          return;
        }
      }
    } else {
      bot.sendMessage(
        chatId,
        `It's not your turn, ${from.first_name}. Please wait for your turn.`
      );
    }
  }

  questDetails.state = "ready";
  await saveQuest(questDetails);
}

async function startQuest(questDetails) {
  await saveQuest(questDetails);

  bot.sendMessage(questDetails.telegramChatId, "Loading quest...");
  const firstChapter = await generateFirstChapter(questDetails);

  questDetails.chapters[0].text = firstChapter;
  await saveQuest(questDetails);
  bot.sendMessage(questDetails.telegramChatId, firstChapter);

  questDetails.chapters[0].storySoFar = await summariseStorySoFar(questDetails);
  console.log(questDetails.chapters[0].storySoFar);
  questDetails.state = "ready";
  await saveQuest(questDetails);

  bot.sendMessage(questDetails.telegramChatId, "Generating audio...");
  const audio = await generateChapterAudio(questDetails, 1);
  bot.sendAudio(questDetails.telegramChatId, audio, {
    title: "Chapter 1",
  });

  bot.sendMessage(questDetails.telegramChatId, "Generating chapter image...");
  const characterDescriptions = questDetails.players
    .map((player, index) => {
      return (
        `\nCharacter Name: ${player.characterName}` +
        `\nCharacter Description: ${player.characterDescription}`
      );
    })
    .join("\n\n");

  await requestImagine(
    "An digital fantasy art painting capturing the scene from a story, the type of the painting will be in line with the story genre which is - " +
      questDetails.genre +
      ". The painting will include the " +
      questDetails.players.length +
      " character(s) with caricatures of their descriptions - " +
      characterDescriptions +
      "This a summary of the chapter - " +
      questDetails.chapters[0].storySoFar +
      " --v 5",
    questDetails.telegramChatId.toString() + "-img"
  );
}

async function generateChapterAudio(questDetails, chapterNumber) {
  const chapter = questDetails.chapters[chapterNumber - 1];
  const resp = await getAudioStream(chapter.text);
  const uploadParams = {
    Bucket: Bucket.Uploads.bucketName,
    Key: questDetails.telegramChatId + "-" + chapterNumber + ".mp3",
    Body: resp.data,
    ContentType: "audio/mpeg",
  };

  await s3.putObject(uploadParams);
  const retrieveParams = {
    Bucket: Bucket.Uploads.bucketName,
    Key: questDetails.telegramChatId + "-" + chapterNumber + ".mp3",
  };

  const audio = await s3.getObject(retrieveParams);
  return audio.Body;
}
