import { Api, use, StackContext } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack, app } : StackContext) {
  const { table,bucket } = use(StorageStack);

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
      "GET /quests": "packages/functions/src/web/list.main",
      "POST /quests": "packages/functions/src/web/create.main",
      "GET /quests/{id}": "packages/functions/src/web/get.main",
      "PUT /quests/{id}": "packages/functions/src/web/update.main",
      "DELETE /quests/{id}": "packages/functions/src/web/delete.main",
    },
  });

  const telegramApi = new Api(stack, "TelegramApi", {
    //customDomain: app.stage === "prod" ? "notes-api.seed-demo.club" : undefined,
    defaults: {
      //authorizer: "iam",
      function: {
        bind: [table,bucket],
        timeout:120,
        environment: {
          OPEN_AI_KEY : process.env.OPEN_AI_KEY || "",
          TELEGRAM_BOT_TOKEN : process.env.TELEGRAM_BOT_TOKEN || "",
          ELEVEN_LABS_KEY : process.env.ELEVEN_LABS_KEY || "",
          ELEVEN_LABS_VOICE_ID : process.env.ELEVEN_LABS_VOICE_ID || "",
          NEXTLEG_MJ_KEY : process.env.NEXTLEG_MJ_KEY || "",
          //STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        },
      },
    },
    routes: {
      "POST /telegram": "packages/functions/src/telegram/telegramHandler.main",
      "POST /midjourney": "packages/functions/src/midjourney/midjourneyHandler.main",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.customDomainUrl || api.url,
    TelegramApiEndpoint: telegramApi.customDomainUrl || telegramApi.url,
  });



  // Return the API resource
  return {
    api,
    telegramApi,
  };
}
