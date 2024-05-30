import algosdk from 'algosdk';
import { Buffer } from 'buffer';

interface IGetBoxReferenceAnswerInput {
  app: number | bigint;
  address: algosdk.Address;
}
const getBoxReferenceAnswer = (input: IGetBoxReferenceAnswerInput) => {
  const box: algosdk.BoxReference = {
    appIndex: Number(input.app),
    name: new Uint8Array(Buffer.concat([Buffer.from('a'), Buffer.from(input.address.publicKey)])), // data box
  };
  return box;
};
export default getBoxReferenceAnswer;
