import { Table } from "sst/node/table";
import * as uuid from "uuid";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";
import { initQuest, generateFirstChapter } from "@broquest/core/quest";
import { requestUpscale } from "@broquest/core/midjourney";
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

export const main = handler(async (event) => {
  console.log(event.body);
  const data = JSON.parse(event.body);
  const ref = data.ref.toString();
  const buttonId = data.buttonMessageId;
  const imgUrl = data.imageUrl;
  if (ref.endsWith("-img")) {
    await requestUpscale(buttonId, ref.split("-img")[0]);
  } else {
    bot.sendPhoto(ref, imgUrl);
  }
  /*const data = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.iam.cognitoIdentity.identityId;
  let quest = initQuest(userId, data);
  const resp = await generateFirstChapter(quest);
  quest = chapterSubmission(quest);
  quest.chapters[0].text = resp;
  console.log(quest);

  const params = {
    TableName: Table.Quest1.tableName,
    Item: quest,
  };

  await dynamoDb.put(params);

  return params.Item;*/
});
