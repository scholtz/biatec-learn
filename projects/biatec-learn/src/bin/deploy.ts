/* eslint-disable no-console */
import algosdk, { Transaction } from 'algosdk';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { BiatecLearnClient } from '../../contracts/clients/BiatecLearnClient';

const algod = new algosdk.Algodv2(
  process.env.algodToken ?? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  process.env.algodHost ?? 'http://localhost',
  process.env.algodPort ?? '4001'
);
let appBiatecLearnAppId = BigInt(process.env.appBiatecLearnAppId ?? '0');

const signers: algosdk.Account[] = [];
if (process.env.signer1) {
  signers.push(algosdk.mnemonicToSecretKey(process.env.signer1));
}
if (process.env.signer2) {
  signers.push(algosdk.mnemonicToSecretKey(process.env.signer2));
}
if (process.env.signer3) {
  signers.push(algosdk.mnemonicToSecretKey(process.env.signer3));
}
if (process.env.signer4) {
  signers.push(algosdk.mnemonicToSecretKey(process.env.signer4));
}
if (process.env.signer5) {
  signers.push(algosdk.mnemonicToSecretKey(process.env.signer5));
}
const deployerMsigParams: algosdk.MultisigMetadata = {
  addrs: signers.map((a) => a.addr),
  threshold: 4,
  version: 1,
};
const msigAddress = algosdk.multisigAddress(deployerMsigParams);
// const x = JSON.stringify(JSON.parse(process.env.deployerMsigParams ?? ''));
// console.log('x', x);
// const deployerMsigParams: algosdk.MultisigMetadata = JSON.parse(x);
console.log('deployerMsigParams.addrs', msigAddress, deployerMsigParams.addrs);

const signer: TransactionSignerAccount = {
  addr: process.env.deployerAddr ?? msigAddress,
  // eslint-disable-next-line no-unused-vars
  signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
    return txnGroup.map((tx) => {
      // console.log('deployerMsigParams', deployerMsigParams);
      let msigObject = algosdk.createMultisigTransaction(tx, deployerMsigParams);
      // console.log('msigObject', msigObject);
      // eslint-disable-next-line no-restricted-syntax, no-shadow
      for (const signer of signers) {
        console.log(`signing ${tx.txID()} from ${signer.addr}`);
        msigObject = algosdk.appendSignMultisigTransaction(msigObject, deployerMsigParams, signer.sk).blob;
      }
      // console.log('decoded', algosdk.decodeSignedTransaction(msigObject).msig);
      return msigObject;
    });
  },
};

const app = async () => {
  console.log(`${Date()} App started - Deployer: ${signer.addr}`);

  const clientBiatecLearnClient = new BiatecLearnClient(
    {
      sender: signer,
      resolveBy: 'id',
      id: Number(appBiatecLearnAppId),
    },
    algod
  );

  if (!appBiatecLearnAppId) {
    await clientBiatecLearnClient.create.createApplication({});
    const ref = await clientBiatecLearnClient.appClient.getAppReference();
    appBiatecLearnAppId = BigInt(ref.appId);
    console.log(`Deployed appBiatecLearnAppId: ${appBiatecLearnAppId} ${ref.appAddress}`);
  } else {
    console.log(
      `Using appBiatecLearnAppId: ${appBiatecLearnAppId} ${algosdk.getApplicationAddress(appBiatecLearnAppId)}`
    );
  }
};

app();
