import { Contract } from '@algorandfoundation/tealscript';

type Question = {
  assetId: uint64;
  count: uint64;
  reward: uint64;
  index: uint64;

  title: string;
  text: string;

  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
};

export class BiatecLearn extends Contract {
  /**
   * Version of the smart contract
   */
  version = GlobalStateKey<string>({ key: 'scver' });

  /** Questions stored by the hash of the ID */
  questions = BoxMap<bytes32, Question>({ prefix: 'q' });

  /**
   * Answers stored per address
   */
  answers = BoxMap<Address, uint64>({ prefix: 'a' });

  /**
   * Initial setup
   */
  createApplication(): void {
    this.version.value = 'BIATEC-EARN-01-01-01';
  }

  /**
   * Creator can update application
   */
  updateApplication(version: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    this.version.value = version;
  }

  /**
   * Setup the question
   *
   * @param deposit Deposit txn
   * @param id Hash of the ID
   * @param question Question to answer
   */
  public setupQuestion(deposit: Txn, id: bytes32, question: Question): void {
    if (question.assetId === 0) {
      assert(deposit.receiver === globals.currentApplicationAddress, 'Receiver must be the smart contract address');
      assert(question.count * question.reward === deposit.amount, 'Amount does not match question');
    } else {
      assert(
        deposit.assetReceiver === globals.currentApplicationAddress,
        'Receiver must be the smart contract address'
      );
      assert(question.assetId === deposit.xferAsset.id, 'assetId does not match question setup');
      assert(question.count * question.reward === deposit.amount, 'Asset amount does not match question');
    }

    assert(!this.questions(id).exists, 'Question already exists');

    this.questions(id).value = question;
  }

  /**
   * Setup the question
   *
   * @param id ID of the question. The hash (sha512_256) of the ID is the key in the box.
   * @param answer Answer to the question
   */
  public answerQuestion(id: string, answer: uint64): void {
    const hash = sha512_256(id);
    assert(this.questions(hash).exists, 'Question was not found');
    const qBox = this.questions(hash).value;
    const assetId = qBox.assetId;
    const reward = qBox.reward;
    const count = qBox.count;
    assert(qBox.index === answer);
    assert(qBox.count > 0, 'This question has been already claimed maximum times');
    qBox.count = count - 1;

    assert(!this.answers(this.txn.sender).exists, 'You have already answered this question');
    this.answers(this.txn.sender).value = 1;
    if (assetId === 0) {
      sendPayment({
        amount: reward,
        receiver: this.txn.sender,
        note: id,
        fee: 2000, // we pay fee for user as well so that he can receive initial algo deposit
      });
    } else {
      sendAssetTransfer({
        assetAmount: reward,
        assetReceiver: this.txn.sender,
        xferAsset: AssetID.fromUint64(assetId),
        note: id,
        fee: 2000, // we pay fee for user as well so that he can receive initial algo deposit
      });
    }
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   *
   * @param amount Amount
   * @param note Note
   * @param receiver Receiver
   */
  payment(amount: uint64, receiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendPayment({
      amount: amount,
      receiver: receiver,
      note: note,
    });
    assert(this.txn.sender === globals.creatorAddress);
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   * @param xferAsset Asset id
   * @param assetAmount Amount
   * @param note Note
   * @param assetReceiver Receiver
   */
  assetTransfer(xferAsset: AssetID, assetAmount: uint64, assetReceiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendAssetTransfer({
      assetAmount: assetAmount,
      assetReceiver: assetReceiver,
      xferAsset: xferAsset,
      note: note,
    });
  }

  /**
   * Creator can perfom key registration for this LP pool
   */
  sendOnlineKeyRegistration(
    votePk: bytes,
    selectionPk: bytes,
    stateProofPk: bytes,
    voteFirst: uint64,
    voteLast: uint64,
    voteKeyDilution: uint64
  ): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendOnlineKeyRegistration({
      selectionPK: selectionPk,
      stateProofPK: stateProofPk,
      voteFirst: voteFirst,
      voteKeyDilution: voteKeyDilution,
      voteLast: voteLast,
      votePK: votePk,
      fee: 0,
    });
  }

  /**
   * Creator can perfom key unregistration for this LP pool
   */
  sendOfflineKeyRegistration(): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendOfflineKeyRegistration({ fee: 0 });
  }
}
