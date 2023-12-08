# Transaction syntax - Algorand SDK
This demo contains examples of transactions created via Algorand SDK

The transactions performed are
1. Create Asset
2. Modify Asset
3. Transfer Algos
4. Asset Opt In
5. Transfer Asset

Refer to the following guides for transaction syntax

- [Algorand SDK (under functions section)](https://algorand.github.io/js-algorand-sdk/modules.html)

## Setup instructions

### Install packages
```
yarn install
```

### Update environement variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.

### Run transactions using Algorand SDK
```
# From project directory
node src/transactions.js
```
