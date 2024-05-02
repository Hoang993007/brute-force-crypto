import {
  FallbackProvider,
  JsonRpcBatchProvider,
  StaticJsonRpcProvider,
} from '@ethersproject/providers';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { getChainData } from 'chainlist/axios';
import * as dotenv from 'dotenv';
import { shuffle } from 'lodash';
dotenv.config();

const blacklistRpc = ['https://eth.drpc.org'];

const rpcBody = JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_getBlockByNumber',
  params: ['latest', false],
  id: 1,
});

const formatData = (url, data) => {
  let height = data?.result?.number ?? null;
  let latency = data?.latency ?? null;
  if (height) {
    const hexString = height.toString(16);
    height = parseInt(hexString, 16);
  } else {
    latency = null;
  }
  return { url, height, latency };
};

const fetchChain = async (baseURL) => {
  if (baseURL.includes('API_KEY')) return null;
  try {
    const API = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    API.interceptors.request.use(function (request: any) {
      request.requestStart = Date.now();
      return request;
    });

    API.interceptors.response.use(
      function (response: any) {
        response.latency = Date.now() - response.config.requestStart;
        return response;
      },
      function (error) {
        if (error.response) {
          error.response.latency = null;
        }

        return Promise.reject(error);
      },
    );

    const { data, latency } = (await API.post('', rpcBody)) as any;

    return { data: formatData(baseURL, { ...data, latency }) };
  } catch (error) {
    return null;
  }
};

const assessChain = (chain: any) => {
  chain = chain.filter(
    (el) =>
      el.data && el.data.height && el.data.latency && el.data.latency < 400,
  );
  const sortedData = chain?.sort((a, b) => {
    const h1 = a?.data?.height;
    const h2 = b?.data?.height;
    const l1 = a?.data?.latency;
    const l2 = b?.data?.latency;

    if (!h2) {
      return -1;
    }

    if (h2 - h1 > 0) {
      return 1;
    }
    if (h2 - h1 < 0) {
      return -1;
    }
    if (h1 === h2) {
      if (l1 - l2 < 0) {
        return -1;
      } else {
        return 1;
      }
    }
  });

  const topRpc = sortedData.find((el) => el.data.latency < 900)?.data ?? {};

  const res = sortedData
    .map(({ data, ...rest }) => {
      const { height = null, latency = null, url = '' } = data || {};

      let trust = false;
      let disableConnect = false;

      if (topRpc.height - height < 1000 && topRpc.latency - latency > -100) {
        trust = true;
      } else {
        trust = false;
      }

      if (url.includes('wss://') || url.includes('API_KEY'))
        disableConnect = true;

      const lat = latency ? (latency / 1000).toFixed(3) + 's' : null;

      return {
        ...rest,
        data: { ...data, height, latency: lat, trust, disableConnect },
      };
    })
    .filter((el) => el.data.trust);

  console.log(res);

  return res;
};

@Injectable()
export class EtherService {
  network: { rpc: string[]; chainId: number } | null;

  @Cron(CronExpression.EVERY_5_SECONDS)
  async getChainDataCronJob() {
    await this.refreshRpc();
  }

  async refreshRpc() {
    console.log('Start refreshing chain data...');
    const res = await getChainData();
    const callRes = (
      await Promise.all(
        res.rpc
          .map((el) => {
            return el.url;
          })
          .filter((el) => !!el)
          .filter((url) => {
            return !url.includes('wss://') && !blacklistRpc.includes(url);
          })
          .map(async (el) => {
            return await fetchChain(el);
          }),
      )
    ).filter((el) => !!el);
    const testedChain = await assessChain(callRes);
    const trustedRpc = testedChain
      .filter((el) => el.data.trust)
      .map((el) => el.data.url);
    this.network = { ...res, rpc: trustedRpc };
  }

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
