import {
  FallbackProvider,
  JsonRpcBatchProvider,
  StaticJsonRpcProvider,
} from '@ethersproject/providers';
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { shuffle } from 'lodash';
dotenv.config();

@Injectable()
export class EtherService {
  network: { rpc: string[]; chainId: number } | null = {
    rpc: ['https://eth.llamarpc.com'],
    chainId: 1,
  };

  getBatchProvider() {
    const rpc = shuffle(this.network.rpc)[0];
    return new JsonRpcBatchProvider(rpc, this.network.chainId);
  }

  getProvider() {
    const rpc = shuffle(this.network.rpc)[0];
    console.log('=== [RPC]: ', rpc);
    return new StaticJsonRpcProvider(rpc, this.network.chainId);
  }

  getFallbackProviders() {
    new FallbackProvider(
      shuffle(this.network.rpc).map((rpcUrl, index) => {
        const priority = index + 1;
        return {
          provider: new StaticJsonRpcProvider(rpcUrl, this.network.chainId),
          priority,
          stallTimeout: 1250 + 100 * priority,
        };
      }),
      1,
    );
  }
}
