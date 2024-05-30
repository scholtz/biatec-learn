interface IQuestion {
  assetId: bigint;
  count: bigint;
  reward: bigint;
  index: bigint;
  title: string;
  text: string;

  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

export default IQuestion;
