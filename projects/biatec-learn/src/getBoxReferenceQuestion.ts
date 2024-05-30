import algosdk from 'algosdk';
import { Buffer } from 'buffer';

interface IGetBoxReferenceQuestionInput {
  app: number | bigint;
  hash: Uint8Array;
}
const getBoxReferenceQuestion = (input: IGetBoxReferenceQuestionInput) => {
  const box: algosdk.BoxReference = {
    appIndex: Number(input.app),
    name: new Uint8Array(Buffer.concat([Buffer.from('q'), Buffer.from(input.hash)])), // data box
  };
  return box;
};
export default getBoxReferenceQuestion;
