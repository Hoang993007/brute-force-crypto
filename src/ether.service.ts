import {
  FallbackProvider,
  JsonRpcBatchProvider,
  StaticJsonRpcProvider,
} from '@ethersproject/providers';
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { shuffle } from 'lodash';
dotenv.config();

const network = {
  id: 'ETH_MAINNET',
  name: 'Ethereum',
  chainId: 1,
  networkId: 1,
  chain: 'eth',
  network: 'mainnet',
  // rpcUrls: ['http://172.16.199.36:8545'],
  rpcUrls: ['https://mainnet.gateway.tenderly.co'],
  blockExplorer: {
    name: 'Etherscan',
    url: 'https://etherscan.io/',
  },
  blockTime: 15000,
  isCrawlInternalTx: false,
  multicallAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  otherRpcUrls: [],
};

@Injectable()
export class EtherService {
  getBatchProvider() {
    const rpc = shuffle(network.rpcUrls)[0];
    return new JsonRpcBatchProvider(rpc, network.chainId);
  }

  getProvider() {
    const rpc = shuffle(network.rpcUrls)[0];
    return new StaticJsonRpcProvider(rpc, network.chainId);
  }

  getFallbackProviders() {
    new FallbackProvider(
      shuffle(network.rpcUrls).map((rpcUrl, index) => {
        const priority = index + 1;
        return {
          provider: new StaticJsonRpcProvider(rpcUrl, network.chainId),
          priority,
          stallTimeout: 1250 + 100 * priority,
        };
      }),
      1,
    );
  }
}
