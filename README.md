# exchange withdraw scripts without external libs by [alfar](https://t.me/+FozX3VZA0RIyNWY6)

**Note:** This script is still in development. Use it with on your own risk!

## Setup
1. Install [Node.js](https://nodejs.org/en/download)
1. Update config on `<exchange>/withdraw.cjs`
1. Fill `data.csv` with addresses and amounts in format `address,amount`
1. Whitelist addresses if needed
1. Run `node <exchange>/withdraw.cjs`
1. If `token` and `chain` is not known: keys must be specified for first api request and after first run script will create `currencies.csv` file with all withdrawable currencies from exchange in format `ccy,chain,fee`

Discover more scripts on our [Telegram channel](https://t.me/+FozX3VZA0RIyNWY6)

:star2: Виносимо проекти в [телеграм каналі](https://t.me/+FozX3VZA0RIyNWY6)