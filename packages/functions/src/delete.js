import { Table } from "sst/node/table";
import handler from "@broquest/core/handler";
import dynamoDb from "@broquest/core/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.Quest.tableName,
    // 'Key' defines the partition key and sort key of the item to be removed
    Key: {
      userId: event.requestContext.authorizer.iam.cognitoIdentity.identityId,
      questId: event.pathParameters.id, // The id of the quest from the path
    },
  };

  await dynamoDb.delete(params);

  return { status: true };
});
