import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, { Transaction } from 'algosdk';
import { sha512_256 } from 'js-sha512';
import { BiatecLearnClient } from '../contracts/clients/BiatecLearnClient';
import getBoxReferenceQuestion from '../src/getBoxReferenceQuestion';
import getBoxReferenceAnswer from '../src/getBoxReferenceAnswer';
import IQuestion from '../src/types/IQuestion';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });
let deployer: algosdk.Account;

let appClient: BiatecLearnClient;

describe('BiatecLearn', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;
    const { algorand } = fixture;
    deployer = await fixture.context.generateAccount({ initialFunds: algokit.microAlgos(1_000_000_000) });

    appClient = new BiatecLearnClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algorand.client.algod
    );

    await appClient.create.createApplication({});
    const ref = await appClient.appClient.getAppReference();
    expect(ref.appId).toBeGreaterThan(0);

    const { algod } = fixture.context;
    const params = await algod.getTransactionParams().do();
    const fundTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 1_000_000n,
      from: deployer.addr,
      suggestedParams: params,
      to: ref.appAddress,
    });
    const signed = fundTx.signTxn(deployer.sk);
    await algod.sendRawTransaction(signed).do();
  });

  test('create question answer question', async () => {
    const { algod } = fixture.context;
    const params = await algod.getTransactionParams().do();

    const ref = await appClient.appClient.getAppReference();
    const questionId = 'test-question-1';
    // eslint-disable-next-line camelcase
    const questionHash = sha512_256.arrayBuffer(questionId);
    const questionUint8 = new Uint8Array(questionHash);
    const question: IQuestion = {
      title: 'Test title',
      text: 'Does this test work?',
      answer1: 'Yes',
      answer2: 'No',
      answer3: '',
      answer4: '',
      answer5: '',
      assetId: 0n,
      count: 2n,
      reward: 1000000n,
      index: 1n,
    };
    const accountQuestioner = await fixture.context.generateAccount({
      initialFunds: algokit.microAlgos(1_000_000_000),
    });
    const accountQuestionerSigner = {
      addr: accountQuestioner.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(accountQuestioner.sk));
      },
    };
    const appClientQuestioner = new BiatecLearnClient(
      {
        sender: accountQuestionerSigner,
        resolveBy: 'id',
        id: ref.appId,
      },
      algod
    );
    const deposit = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 2000000n,
      from: accountQuestioner.addr,
      suggestedParams: params,
      to: ref.appAddress,
    });
    await appClientQuestioner.setupQuestion(
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
        boxes: [getBoxReferenceQuestion({ app: ref.appId, hash: questionUint8 })],
      }
    );
    const accountAnswer1 = await fixture.context.generateAccount({ initialFunds: algokit.microAlgos(1000000) });
    const accountAnswer1Signer = {
      addr: accountAnswer1.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(accountAnswer1.sk));
      },
    };
    const appClientAnswer1 = new BiatecLearnClient(
      {
        sender: accountAnswer1Signer,
        resolveBy: 'id',
        id: ref.appId,
      },
      algod
    );
    await appClientAnswer1.answerQuestion(
      {
        id: questionId,
        answer: 1n,
      },
      {
        sendParams: { ...params, fee: algokit.microAlgos(1000) },
        boxes: [
          getBoxReferenceQuestion({ app: ref.appId, hash: questionUint8 }),
          getBoxReferenceAnswer({ app: ref.appId, address: algosdk.decodeAddress(accountAnswer1.addr) }),
        ],
      }
    );
    const accountAnswer2 = await fixture.context.generateAccount({ initialFunds: algokit.microAlgos(1000000) });
    const accountAnswer2Signer = {
      addr: accountAnswer2.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(accountAnswer2.sk));
      },
    };
    const appClientAnswer2 = new BiatecLearnClient(
      {
        sender: accountAnswer2Signer,
        resolveBy: 'id',
        id: ref.appId,
      },
      algod
    );
    await appClientAnswer2.answerQuestion(
      {
        id: questionId,
        answer: 1n,
      },
      {
        sendParams: { ...params, fee: algokit.microAlgos(1000) },
        boxes: [
          getBoxReferenceQuestion({ app: ref.appId, hash: questionUint8 }),
          getBoxReferenceAnswer({ app: ref.appId, address: algosdk.decodeAddress(accountAnswer2.addr) }),
        ],
      }
    );

    const accountAnswer3 = await fixture.context.generateAccount({ initialFunds: algokit.microAlgos(1000000) });
    const accountAnswer3Signer = {
      addr: accountAnswer3.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(accountAnswer3.sk));
      },
    };
    const appClientAnswer3 = new BiatecLearnClient(
      {
        sender: accountAnswer3Signer,
        resolveBy: 'id',
        id: ref.appId,
      },
      algod
    );
    try {
      await appClientAnswer3.answerQuestion(
        {
          id: questionId,
          answer: 1n,
        },
        {
          sendParams: { ...params, fee: algokit.microAlgos(1000) },
          boxes: [
            getBoxReferenceQuestion({ app: ref.appId, hash: questionUint8 }),
            getBoxReferenceAnswer({ app: ref.appId, address: algosdk.decodeAddress(accountAnswer3.addr) }),
          ],
        }
      );
      expect(true).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      expect(e.message).toContain('assert failed');
    }
  });
});
