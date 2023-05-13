import { Table } from "sst/node/table";
import * as uuid from "uuid";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";
import { initQuest, generateFirstChapter } from "@broquest/core/quest";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
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

  return params.Item;
});
