const algosdk = require("algosdk");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

const transferAlgos = async (fromAccount, toAddr, amount) => {
  console.log("Transferring Algos...");
  
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: fromAccount.addr,
    to: toAddr,
    amount,
    suggestedParams
});

  // sign the transaction
  const signedTxn = txn.signTxn(fromAccount.sk);

  return await submitToNetwork(signedTxn);
}

const createAsset = async () => {
  console.log("Creating asset...");

  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the asset creation transaction
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    total: 1000000,
    decimals: 0,
    assetName: "TESTASSET",
    unitName: "TA",
    assetURL: "website",
    assetMetadataHash: undefined,
    defaultFrozen: false,
    freeze: creator.addr,
    manager: creator.addr,
    clawback: creator.addr,
    reserve: creator.addr,
    suggestedParams,
  });

  // sign the transaction
  const signedTxn = txn.signTxn(creator.sk);

  return await submitToNetwork(signedTxn);
}

const modifyAssetClawback = async (assetId, manager, clawbackAddr) => {
  console.log("Modifying clawback address for asset...");
  
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    from: manager.addr,
    assetIndex: assetId,
    clawback: clawbackAddr,
    suggestedParams,
    strictEmptyAddressChecking: false
  });

  // sign the transaction
  const signedTxn = txn.signTxn(manager.sk);

  return await submitToNetwork(signedTxn);
};

const assetOptIn = async (receiver, assetId) => {
  console.log("Receiver Opt In the asset...");

  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: receiver.addr,
    to: receiver.addr,
    assetIndex: assetId,
    amount: 0,
    suggestedParams
  });

  // sign the transaction
  const signedTxn = txn.signTxn(receiver.sk);

  return await submitToNetwork(signedTxn);
};

const transferAsset = async (sender, receiver, assetId, amount) => {
  console.log("Transferring asset...");

  const suggestedParams = await algodClient.getTransactionParams().do();
  
  let txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    to: receiver.addr,
    assetIndex: assetId,
    amount,
    suggestedParams
  });

  // sign the transaction
  const signedTxn = txn.signTxn(sender.sk);

  return await submitToNetwork(signedTxn);
};

const getCreatedAsset = async (account, assetId) => {
  let accountInfo = await algodClient.accountInformation(account.addr).do();

  const asset = accountInfo["created-assets"].find((asset) => {
    return asset["index"] === assetId;
  });

  return asset;
};

const getAssetHoldings = async (account, assetId) => {
  let accountInfo = await algodClient.accountInformation(account.addr).do();

  const asset = accountInfo["assets"].find((asset) => {
    return asset["asset-id"] === assetId;
  });

  return asset;
};

(async () => {
  try {
    // create asset
    const createAssetTxn = await createAsset();
    const assetId = createAssetTxn["asset-index"];

    // modify clawback address - manager is creator
    const newClawbackAcc = algosdk.generateAccount();
    console.log("Clawback address will be %s", newClawbackAcc.addr);
    await modifyAssetClawback(assetId, creator, newClawbackAcc.addr);
    asset = await getCreatedAsset(creator, assetId);
    console.log("Clawback address modified to %s", asset["params"]["clawback"]);

    // create asset receiver
    const receiver = algosdk.generateAccount();
    await transferAlgos(creator, receiver.addr, 300000);

    // asset opt in
    await assetOptIn(receiver, assetId);

    // transfer asset
    await transferAsset(creator, receiver, assetId, 100);
    const assetHolding = await getAssetHoldings(receiver, assetId);
    console.log(assetHolding);
  }catch(error){
    console.log(error);
  }
})();
