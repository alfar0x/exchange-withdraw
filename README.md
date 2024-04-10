# okx withdraw without external libs by [alfar](https://t.me/+FozX3VZA0RIyNWY6)

**Note:** This script is still in development. Use it with on your own risk!

## Setup
1. Install [Node.js](https://nodejs.org/en/download)
1. Update config on `withdraw.cjs`
1. Fill `data.csv` with addresses and amounts in format `address,amount`
1. Whitelist addresses on okx
1. Run `node withdraw.cjs`
1. If `ccy` and `chain` is not known: keys must be specified for first okx api request and after first run script will create `currencies.csv` file with all withdrawable currencies from okx in format `ccy,chain,fee`

Discover more scripts on our [Telegram channel](https://t.me/+FozX3VZA0RIyNWY6)

:star2: Виносимо проекти в [телеграм каналі](https://t.me/+FozX3VZA0RIyNWY6)