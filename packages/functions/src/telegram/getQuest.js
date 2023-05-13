import { Table } from "sst/node/table";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";

export default async function getQuest(chatId) {
  const params = {
    TableName: Table.Quest.tableName,
    // 'KeyConditionExpression' defines the condition for the query
    // - 'userId = :userId': only return items with matching 'userId'
    //   partition key
    KeyConditionExpression: "telegramChatId = :chatId",
    // 'ExpressionAttributeValues' defines the value in the condition
    // - ':userId': defines 'userId' to be the id of the author
    ExpressionAttributeValues: {
      ":chatId": chatId,
    },
    Limit: 1,
  };

  const result = await dynamoDb.query(params);
  return result.Items[0];
}
