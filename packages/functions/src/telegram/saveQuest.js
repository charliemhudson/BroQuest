import { Table } from "sst/node/table";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";

export default async function saveQuest(state) {
  const params = {
    TableName: Table.Quest.tableName,
    Item: state,
  };

  await dynamoDb.put(params);
}
