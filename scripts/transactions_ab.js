const { executeTransaction } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const algosdk = require("algosdk");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");

    // create asset - refer to assets/asa.yaml
    const createAssetTxn = await deployer.deployASA("TESTASSET", {
        creator: master,
        totalFee: 1000,
        validRounds: 1002,
    });
    const assetId = createAssetTxn.assetIndex;

    // modify clawback address - manager is master
    const newClawbackAcc = algosdk.generateAccount();
    console.log("Clawback address will be %s", newClawbackAcc.addr);
    await executeTransaction(deployer, {
        type: types.TransactionType.ModifyAsset,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        assetID: assetId,
        fields: {
            clawback: newClawbackAcc.addr,
        },
        payFlags: { totalFee: 1000 },
    });
    const asset = await deployer.getAssetByID(assetId);
    console.log("Clawback address modified to %s", asset["params"]["clawback"]);

    // create asset receiver
    const receiver = algosdk.generateAccount();
    await executeTransaction(deployer, {
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: receiver.addr,
        amountMicroAlgos: 300000,
        payFlags: { totalFee: 1000 },
    });

    // asset opt in
    await executeTransaction(deployer, {
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: receiver,
        assetID: assetId,
        payFlags: { totalFee: 1000 },
    });

    // transfer asset
    await executeTransaction(deployer, {
        type: types.TransactionType.TransferAsset,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: receiver.addr,
        amount: 100,
        assetID: assetId,
        payFlags: { totalFee: 1000 },
    });

    const receiverAcc = await deployer.algodClient.accountInformation(receiver.addr).do();
    console.log(receiverAcc.assets);
}

module.exports = { default: run };
