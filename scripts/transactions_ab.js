const { types } = require("@algo-builder/web");
const algosdk = require("algosdk");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");

    // create asset - refer to assets/asa.yaml
    const asaDef = {
        total: 1000000,
        decimals: 0,
        defaultFrozen: false,
        unitName: "TA",
        url: "website",
        metadataHash: "12312442142141241244444411111133",
        note: "note",
        manager: master.addr,
        reserve: master.addr,
        freeze: master.addr,
        clawback: master.addr
    };

    // using deployer.deployASADef instead of deployer.deployASA
    const createAssetTxn = await deployer.deployASADef("TESTASSET", asaDef, {
        creator: master,
        totalFee: 1000,
        validRounds: 1002,
    });
    const assetId = createAssetTxn.assetIndex;

    // modify clawback address - manager is master
    const newClawbackAcc = algosdk.generateAccount();
    console.log("Clawback address will be %s", newClawbackAcc.addr);
    await deployer.executeTx({
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
    console.log("Transferring algos...");
    const receiver = algosdk.generateAccount();
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: receiver.addr,
        amountMicroAlgos: 300000,
        payFlags: { totalFee: 1000 },
    });

    // asset opt in
    console.log("Asset Opt In...");
    await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: receiver,
        assetID: assetId,
        payFlags: { totalFee: 1000 },
    });

    // transfer asset
    console.log("Transferring asset...");
    await deployer.executeTx({
        type: types.TransactionType.TransferAsset,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: receiver.addr,
        amount: 100,
        assetID: assetId,
        payFlags: { totalFee: 1000 },
    });

    const receiverAcc = await deployer.algodClient.accountInformation(receiver.addr).do();
    console.log("Receiver assets balance:", receiverAcc.assets);
}

module.exports = { default: run };
