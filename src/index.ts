export * from './Forum';
export * from './User';
export * from './Post';
export * from './UserPost';

export class Client {
  BDUSS: string;
  needPlainText: boolean;

  constructor(BDUSS, needPlainText) {
    this.BDUSS = BDUSS;
    this.needPlainText = needPlainText;
  }
}
