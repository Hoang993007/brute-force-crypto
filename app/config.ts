import { EChain } from 'enum';

export const appConfig = {
  ADDRESS_NUM: 1,
  CHAIN: EChain.ETH,
  CHAIN_ID: 1,
  RES_FILE_PATH: process.cwd() + '/app/res.csv',
  RES_FOLDER_PATH: process.cwd() + '/.data/res',
};
