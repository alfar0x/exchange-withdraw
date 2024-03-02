import "dotenv/config";

import ccxt from "ccxt";
import {
  formatRel,
  initDefaultLogger,
  randomInt,
  readByLine,
  sleep,
} from "@alfar/helpers";

const SEC_TO_END = 8 * 60 * 60;
const APPROX_PERCENT = 10;

// [key]
const SYMBOL = "APT";
// networks[key]
const NETWORK = "APT";
// network.id
const CHAIN = "APT-Aptos";

const { API_KEY, SECRET, PASSWORD, FUNDING_PASSWORD } = process.env;

const logger = initDefaultLogger("debug");

const main = async () => {
  // eslint-disable-next-line new-cap
  const exchange = new ccxt.okx({
    apiKey: API_KEY,
    secret: SECRET,
    password: PASSWORD,
    enableRateLimit: true,
  });

  const data = readByLine("data.csv");

  const currencies = await exchange.fetchCurrencies();

  const { fee } = currencies[SYMBOL].networks[NETWORK];

  const minSleepSec =
    ((SEC_TO_END / data.length) * (100 - APPROX_PERCENT)) / 100;

  const maxSleepSec =
    ((SEC_TO_END / data.length) * (100 + APPROX_PERCENT)) / 100;

  const welcomeMsg = [
    `fee ${fee}`,
    `min sleep ${minSleepSec}s`,
    `max sleep ${maxSleepSec}s`,
    `lines found ${data.length}`,
  ].join(" | ");

  logger.info(welcomeMsg);

  await sleep(10);

  for (let idx = 0; idx < data.length; idx += 1) {
    const [address, amountStr] = data[idx].split(",");
    const amount = parseFloat(amountStr);
    logger.info(`${idx} ${address} ${amountStr}`);

    try {
      const params = {
        chain: CHAIN,
        fee,
        network: NETWORK,
        password: FUNDING_PASSWORD,
        toAddress: address,
      };

      const response = await exchange.withdraw(
        SYMBOL,
        amount,
        address,
        "",
        params,
      );
      if (response.msg) throw new Error(response.msg);
    } catch (err) {
      logger.error(err.message);
    }

    const sleepSec = randomInt(minSleepSec, maxSleepSec);
    logger.info(`sleep until ${formatRel(sleepSec)}`);
    await sleep(sleepSec);
  }
};

main();
