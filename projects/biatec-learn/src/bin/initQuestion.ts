/* eslint-disable no-console */
import algosdk, { Transaction } from 'algosdk';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { sha512_256 } from 'js-sha512';
import { BiatecLearnClient } from '../../contracts/clients/BiatecLearnClient';
import IQuestion from '../types/IQuestion';
import getBoxReferenceQuestion from '../getBoxReferenceQuestion';
import getBiatecLearnAppReferences from '../getBiatecLearnAppReferences';

const algod = new algosdk.Algodv2(
  process.env.algodToken ?? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  process.env.algodHost ?? 'http://localhost',
  process.env.algodPort ?? '4001'
);
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
  const appRef = getBiatecLearnAppReferences();
  const appBiatecLearnAppId = appRef['testnet-v1.0'];
  const clientBiatecLearnClient = new BiatecLearnClient(
    {
      sender: signer,
      resolveBy: 'id',
      id: Number(appBiatecLearnAppId),
    },
    algod
  );

  if (!appBiatecLearnAppId) {
    console.log(
      `Using appBiatecLearnAppId: ${appBiatecLearnAppId} ${algosdk.getApplicationAddress(appBiatecLearnAppId)}`
    );
  }

  const questionId = 'question-111561';
  // eslint-disable-next-line camelcase
  const questionHash = sha512_256.arrayBuffer(questionId);
  const questionUint8 = new Uint8Array(questionHash);
  const question: IQuestion = {
    assetId: 0n,
    count: 1n,
    reward: 10000n,
    index: 1n,
    title: 'First question',
    text: 'Test',
    answer1: 'Yes',
    answer2: 'No',
    answer3: '',
    answer4: '',
    answer5: '',
  };
  const params = await algod.getTransactionParams().do();
  const deposit = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    amount: 10000n,
    from: signer.addr,
    suggestedParams: params,
    to: algosdk.getApplicationAddress(appBiatecLearnAppId),
  });

  await clientBiatecLearnClient.setupQuestion(
    {
      deposit,
      id: questionUint8,
      question: [
        question.assetId,
        question.count,
        question.reward,
        question.index,
        question.title,
        question.text,
        question.answer1,
        question.answer2,
        question.answer3,
        question.answer4,
        question.answer5,
      ],
    },
    {
      boxes: [getBoxReferenceQuestion({ app: appBiatecLearnAppId, hash: questionUint8 })],
    }
  );
};

app();
