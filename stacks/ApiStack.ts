import { Api, use, StackContext } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack, app } : StackContext) {
  const { table } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "Api", {
    //customDomain: app.stage === "prod" ? "notes-api.seed-demo.club" : undefined,
    defaults: {
      authorizer: "iam",
      function: {
        bind: [table],
        timeout:120,
        environment: {
          OPEN_AI_KEY : process.env.OPEN_AI_KEY || "",
          //STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        },
      },
    },
    routes: {
      "GET /quests": "packages/functions/src/list.main",
      "POST /quests": "packages/functions/src/create.main",
      "GET /quests/{id}": "packages/functions/src/get.main",
      "PUT /quests/{id}": "packages/functions/src/update.main",
      "DELETE /quests/{id}": "packages/functions/src/delete.main",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.customDomainUrl || api.url,
  });



  // Return the API resource
  return {
    api,
  };
}
