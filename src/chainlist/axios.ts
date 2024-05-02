import axios from 'axios';
import { appConfig } from '../../app/config';
import chainIds from '../constants/chainIds.json';
import { overwrittenChains } from './../constants/additionalChainRegistry/list.js';
import allExtraRpcs from './../constants/extraRpcs.js';

export const chainListAxiosInstance = axios.create({
  baseURL: 'https://chainid.network',
  timeout: 10000,
});

function removeEndingSlashObject(rpc) {
  if (typeof rpc === 'string') {
    return {
      url: removeEndingSlash(rpc),
    };
  } else {
    return {
      ...rpc,
      url: removeEndingSlash(rpc.url),
    };
  }
}

function removeEndingSlash(rpc) {
  return rpc.endsWith('/') ? rpc.substr(0, rpc.length - 1) : rpc;
}

export function populateChain(chain, chainTvls) {
  const extraRpcs = allExtraRpcs[chain.chainId]?.rpcs;

  if (extraRpcs !== undefined) {
    const rpcs = extraRpcs.map(removeEndingSlashObject);

    chain.rpc
      .filter((rpc) => {
        return !rpc.includes('${INFURA_API_KEY}');
      })
      .forEach((rpc) => {
        const rpcObj = removeEndingSlashObject(rpc);
        if (rpcs.find((r) => r.url === rpcObj.url) === undefined) {
          rpcs.push(rpcObj);
        }
      });

    chain.rpc = rpcs;
  } else {
    chain.rpc = chain.rpc.map(removeEndingSlashObject);
  }

  const chainSlug = chainIds[chain.chainId];

  if (chainSlug !== undefined) {
    const defiChain = chainTvls.find((c) => c.name.toLowerCase() === chainSlug);

    return defiChain === undefined
      ? chain
      : {
          ...chain,
          tvl: defiChain.tvl,
          chainSlug,
        };
  }
  return chain;
}

export const getChainData = async () => {
  const chains = (
    await chainListAxiosInstance.request({
      method: 'GET',
      url: '/chains.json',
    })
  ).data;
  const chainTvls = (await axios.get('https://api.llama.fi/chains')).data;
  const overwrittenIds = overwrittenChains.reduce((acc, curr) => {
    acc[curr.chainId] = true;
    return acc;
  }, {});

  const sortedChains = chains
    .filter(
      (el) =>
        el.chainId === appConfig.CHAIN_ID &&
        el.chain.toUpperCase() === appConfig.CHAIN.toUpperCase(),
    )
    .filter((c) => c.status !== 'deprecated' && !overwrittenIds[c.chainId])
    .concat(overwrittenChains)
    .map((chain) => populateChain(chain, chainTvls))
    .sort((a, b) => {
      return (b.tvl ?? 0) - (a.tvl ?? 0);
    });

  const chain = sortedChains.find(
    (el) =>
      el.chainId === appConfig.CHAIN_ID &&
      el.chain.toUpperCase() === appConfig.CHAIN,
  );

  return chain;
};
