import "dotenv/config";

import ccxt from "ccxt";
import { writeFile } from "@alfar/helpers";

const { API_KEY, SECRET, PASSWORD } = process.env;

const main = async () => {
  // eslint-disable-next-line new-cap
  const exchange = new ccxt.okx({
    apiKey: API_KEY,
    secret: SECRET,
    password: PASSWORD,
    enableRateLimit: true,
  });
  const currencies = await exchange.fetchCurrencies();
  writeFile("fees.json", JSON.stringify(currencies, null, 2));
};

main();
