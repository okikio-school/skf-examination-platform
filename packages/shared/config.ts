import process from "node:process";

// @deno-types="npm:@types/rascal"
import type { BrokerConfig } from "rascal";

// @deno-types="npm:@types/rascal"
import rascal from "rascal";
const { withDefaultConfig } = rascal;

function defineConfig(config: BrokerConfig) {
  return withDefaultConfig(config) as BrokerConfig;
}

// const creds = { username: "admin", password: "admin-skf-secret" };
export const RABBIT_MQ_CONN_STRING = process?.env?.["RABBIT_MQ_CONN_STRING"] || 'localhost';
console.log({
  RABBIT_MQ_CONN_STRING
})
export const RABBITMQ_DEFAULT_USER = process?.env?.["RABBITMQ_DEFAULT_USER"] || 'guest';
export const RABBITMQ_DEFAULT_PASS = process?.env?.["RABBITMQ_DEFAULT_PASS"] || 'guest';

export const config: BrokerConfig = defineConfig({
  "vhosts": {
    "/": {
      "connection": {
        "hostname": RABBIT_MQ_CONN_STRING,
        "port": 5672,
        "user": RABBITMQ_DEFAULT_USER,
        "password": RABBITMQ_DEFAULT_PASS,
      },
      
      "exchanges": ["deployment_exchange"], 
      "queues": ["deployment_queue"],
      
      "bindings": ["deployment_exchange -> deployment_queue"],
      "publications": {
        "deployment_publish": {
          "exchange": "deployment_exchange",
          "options": {
            "replyTo": "deployment_queue"
          }
        }
      },

      "subscriptions": {
        "deployment_subscription": {
          "queue": "deployment_queue", 
          "prefetch": 3
        }
      }
    }
  },
});

export default config;