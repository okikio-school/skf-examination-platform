// import { delay } from 'https://deno.land/x/delay@v0.2.0/mod.ts';
import { config } from '@skf/shared/config.ts';

// @deno-types="npm:@types/rascal"
import rascal from 'rascal';
const { createBrokerAsPromised } = rascal;

try {
  const broker = await createBrokerAsPromised(config);
  broker.on('error', console.error);

  // Publish a message
  const correlationId = "50_000";

  // Consume a message
  const subscription = await broker.subscribe('deployment_subscription');
  subscription
    .on('message', async (message, content) => {
      const props = message.properties;
      const method = message.fields;

      if (props.correlationId === correlationId) {
        if (method.routingKey === "reply") {
          console.log([message, content]);
          subscription.cancel();
        } else {
          console.log([content]);

          const response = "localhost:3000";
          const publication = await broker.publish('deployment_publish', String(response), {
            routingKey: 'reply',
            options: {
              correlationId: props.correlationId,
              expiration: 30_000,
            }
          });
        }
      }
    })
    .on('error', console.error);
} catch (err) {
  console.error(err);
}