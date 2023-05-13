import { Table } from "sst/node/table";
import dynamoDb from "@broquest/core/dynamodb";

export default async function deleteQuest(chatId) {
  const params = {
    TableName: Table.Quest.tableName,
    Key: {
      telegramChatId: chatId,
    },
  };

  await dynamoDb.delete(params);
}
