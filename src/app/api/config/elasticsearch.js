import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const esClient = new Client({
  node: process.env.ES_NODE || "http://localhost:9200",
  auth: {
    username: process.env.ES_USERNAME || "elastic",
    password: process.env.ES_PASSWORD || "changeme",
  },
});

export default esClient;
