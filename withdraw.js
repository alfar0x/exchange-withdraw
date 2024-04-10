import "dotenv/config";

import ccxt from "ccxt";
import {
  formatRel,
  initDefaultLogger,
  randomInt,
  readByLine,
  sleep,
} from "@alfar/helpers";

const MINUTES_TO_END = 3 * 24 * 60;
const APPROX_PERCENT = 50;

const SYMBOL = "MATIC";
const NETWORK = "MATIC";
const CHAIN = "MATIC-Polygon";

const FILE_PR_KEYS = "data.csv";

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

  const data = readByLine(FILE_PR_KEYS);

  const currencies = await exchange.fetchCurrencies();

  const { fee } = currencies[SYMBOL].networks[NETWORK];

  const avgSleepSec = (MINUTES_TO_END / data.length) * 60;

  const minSleepSec = Math.round((avgSleepSec * (100 - APPROX_PERCENT)) / 100);

  const maxSleepSec = Math.round((avgSleepSec * (100 + APPROX_PERCENT)) / 100);

  const approxEnd = formatRel(data.length * avgSleepSec);

  const welcomeMsg = [
    `symbol ${SYMBOL}`,
    `network ${NETWORK}`,
    `chain ${CHAIN}`,
    `fee ${fee}`,
    `lines found ${data.length}`,
    `min sleep ${minSleepSec}s`,
    `avg sleep ${maxSleepSec}s`,
    `approx end ${approxEnd}`,
  ].join("\n");

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
        params
      );
      if (response.msg) throw new Error(response.msg);
    } catch (err) {
      logger.error(err.message);
    }

    const sleepSec = randomInt(minSleepSec, maxSleepSec);
    const endSec = (data.length - idx - 1) * avgSleepSec;
    logger.info(
      [
        `sleep until ${formatRel(sleepSec)}`,
        `approx end ${formatRel(endSec)}`,
      ].join(" | ")
    );
    await sleep(sleepSec);
  }
};

main();
