const fs = require("fs");
const { createHmac, randomInt } = require("crypto");

const config = {
  ccy: "MATIC",
  chain: "MATIC-Polygon",
  apiKey: "",
  secret: "",
  password: "",
  minutedToEnd: 3 * 24 * 60,
  approxPercent: 50,
};

const sleep = (s) => new Promise((r) => setTimeout(r, Math.round(s * 1000)));

const formatRelative = (seconds) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h24",
  }).format(new Date(Date.now() + seconds * 1000));
};

const formatDistance = (seconds) => {
  const units = ["s", "m", "h", "d"];
  const unitValues = [1, 60, 3600, 86400];

  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    const unitValue = unitValues[i];
    if (seconds >= unitValue) {
      const value = Math.floor(seconds / unitValue);
      return `${value}${unit}`;
    }
  }

  return "0s";
};

const formatDate = (sec) => {
  const relative = formatRelative(sec);
  const distance = formatDistance(sec);
  return `${relative} (${distance})`;
};

const getHeaders = (method, path, body = "") => {
  const timestamp = new Date().toISOString();

  const sign = createHmac("sha256", config.secret)
    .update(`${timestamp}${method}${path}${body}`)
    .digest("base64");

  return {
    "OK-ACCESS-KEY": config.apiKey,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": config.password,
    "OK-ACCESS-SIGN": sign,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const req = async (path, options) => {
  const response = await fetch("https://www.okx.com" + path, options);
  if (!response.ok) throw new Error(response.statusText);
  const data = await response.json();
  if (data.msg) throw new Error(data.msg);
  if (data.code !== "0") throw new Error(`error code: ${data.code}`);
  return data.data;
};

const get = (path, params) => {
  const method = "GET";
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const fullpath = "/api/v5/" + path + query;
  const headers = getHeaders(method, fullpath);
  return req(fullpath, { method, headers });
};

const post = (path, body = {}) => {
  const method = "POST";
  const str = JSON.stringify(body);
  const fullpath = "/api/v5/" + path;
  const headers = getHeaders(method, fullpath, str);
  return req(fullpath, { method, headers, body: str });
};

const main = async () => {
  const currencies = await get(`asset/currencies`);

  const currenciesStr = currencies
    .filter((c) => c.canWd)
    .map((c) => [c.ccy, c.chain, c.minFee].join(","))
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

  fs.writeFileSync("currencies.csv", currenciesStr, { encoding: "utf-8" });

  const currency = currencies.find(
    (c) => c.ccy === config.ccy && c.chain === config.chain
  );

  if (!currency) throw new Error("currency is not found");

  if (!currency.canWd) throw new Error("currency is not withdrawable");

  const fee = currency.minFee;

  const data = fs
    .readFileSync("data.csv", { encoding: "utf-8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((i) => i.trim().split(","));

  const avgSleepSec = (config.minutedToEnd / data.length) * 60;

  const minSleepSec = Math.round(
    (avgSleepSec * (100 - config.approxPercent)) / 100
  );

  const maxSleepSec = Math.round(
    (avgSleepSec * (100 + config.approxPercent)) / 100
  );

  const welcomeMsg = [
    `ccy ${config.ccy}`,
    `chain ${config.chain}`,
    `fee ${fee}`,
    `accounts ${data.length}`,
    `min sleep ~ ${formatDistance(minSleepSec)}`,
    `max sleep ~ ${formatDistance(maxSleepSec)}`,
    `end ~ ${formatDate(data.length * avgSleepSec)}`,
  ].join("\n");

  console.log(welcomeMsg);

  await sleep(10);

  for (let idx = 0; idx < data.length; idx += 1) {
    const [address, amountStr] = data[idx];

    console.log(`${idx} ${address} ${amountStr}`);

    try {
      await post("asset/withdrawal", {
        ccy: config.ccy,
        amt: amountStr,
        dest: 4,
        toAddr: address,
        fee: fee,
        chain: config.chain,
        walletType: "private",
      });
    } catch (err) {
      console.error(err.message);
    }

    if (idx === data.length - 1) continue;

    const sleepSec = randomInt(minSleepSec, maxSleepSec);
    const endSec = (data.length - idx - 1) * avgSleepSec;

    console.log(`sleep ${formatDate(sleepSec)} | end ${formatDate(endSec)}`);

    await sleep(sleepSec);
  }
};

main();
