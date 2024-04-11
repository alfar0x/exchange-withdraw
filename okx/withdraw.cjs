const fs = require("fs");
const { createHmac, randomInt } = require("crypto");

const config = {
  token: "MATIC",
  chain: "MATIC-Polygon",
  apiKey: "",
  secret: "",
  password: "",
  minutesToEnd: 3 * 24 * 60,
  approxPercent: 50,
};

const sleep = (s) => new Promise((r) => setTimeout(r, Math.round(s * 1000)));

const timenow = () => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h24",
  }).format(new Date(Date.now()));
};

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

  const index = unitValues.findLastIndex((s) => seconds >= s);

  if (index === -1) return "0s";

  return `${Math.floor(seconds / unitValues[index])}${units[index]}`;
};

const formatDate = (sec) => `${formatRelative(sec)} (${formatDistance(sec)})`;

const req = async (method, path, data) => {
  const bodyStr = method === "POST" ? JSON.stringify(data) : "";

  const query =
    method === "GET" && data ? "?" + new URLSearchParams(data).toString() : "";

  const fullpath = "/api/v5/" + path + query;

  const timestamp = new Date().toISOString();

  const signature = createHmac("sha256", config.secret)
    .update(`${timestamp}${method}${fullpath}${bodyStr}`)
    .digest("base64");

  const headers = {
    "OK-ACCESS-KEY": config.apiKey,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": config.password,
    "OK-ACCESS-SIGN": signature,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (method === "POST") options.body = bodyStr;

  const response = await fetch("https://www.okx.com" + fullpath, options);
  if (!response.ok) throw new Error(response.statusText);

  const json = await response.json();

  if (json.msg) throw new Error(json.msg);
  if (json.code !== "0") throw new Error(`error code: ${json.code}`);

  return json.data;
};

const main = async () => {
  const currencies = await req("GET", "asset/currencies");

  const currenciesStr = currencies
    .filter((c) => c.canWd)
    .map((c) => [c.ccy, c.chain, c.minFee].join(","))
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

  fs.writeFileSync("currencies.csv", currenciesStr, { encoding: "utf-8" });

  const currency = currencies.find(
    (c) => c.ccy === config.token && c.chain === config.chain
  );

  if (!currency) throw new Error("currency is not found");
  if (!currency.canWd) throw new Error("currency is not withdrawable");

  const data = fs
    .readFileSync("data.csv", { encoding: "utf-8" })
    .split(/\r?\n/)
    .filter(Boolean);

  const avgSleepSec = (config.minutesToEnd / data.length) * 60;
  const deltaSec = avgSleepSec * (config.approxPercent / 100);
  const minSleepSec = Math.round(avgSleepSec - deltaSec);
  const maxSleepSec = Math.round(avgSleepSec + deltaSec);

  const welcomeMsg = [
    `ccy ${config.token}`,
    `chain ${config.chain}`,
    `fee ${currency.minFee}`,
    `accounts ${data.length}`,
    `min sleep ~ ${formatDistance(minSleepSec)}`,
    `max sleep ~ ${formatDistance(maxSleepSec)}`,
    `end ~ ${formatDate(data.length * avgSleepSec)}`,
  ].join("\n");

  console.log(welcomeMsg);

  await sleep(10);

  for (let idx = 0; idx < data.length; idx += 1) {
    const [address, amountStr] = data[idx].trim().split(",");

    console.log(`${timenow()} | ${idx} ${address} ${amountStr}`);

    try {
      await req("POST", "asset/withdrawal", {
        ccy: config.token,
        amt: amountStr,
        dest: 4,
        toAddr: address,
        fee: currency.minFee,
        chain: config.chain,
        walletType: "private",
      });
    } catch (err) {
      console.error(`ERROR | ${err?.message}`);
    }

    if (idx === data.length - 1) continue;

    const sleepSec = randomInt(minSleepSec, maxSleepSec);
    const endSec = (data.length - idx - 1) * avgSleepSec;

    console.log(`sleep ${formatDate(sleepSec)} | end ${formatDate(endSec)}`);

    await sleep(sleepSec);
  }
};

main();
