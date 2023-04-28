import { Bucket, Table, StackContext } from "sst/constructs";

export function StorageStack({ stack, app } : StackContext) {
  // Create an S3 bucket
  const bucket = new Bucket(stack, "Uploads", {
    cors: [
      {
        maxAge: "1 day",
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      },
    ],
  });

  // Create the DynamoDB table
  const table = new Table(stack, "Quest", {
    fields: {
      userId: "string",
      questId: "string",
      title: "string",
      genre: "string",
      additionalDetails: "string",
      playerCount: "number",


    },
    primaryIndex: { partitionKey: "userId", sortKey: "questId" },
  });

  return {
    table,
    bucket,
  };
}
