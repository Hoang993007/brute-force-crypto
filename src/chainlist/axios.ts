import axios from 'axios';
import { appConfig } from '../../app/config';

export const chainListAxiosInstance = axios.create({
  baseURL: 'https://chainid.network',
  timeout: 10000,
});

export const getChainData = async () => {
  const res = await chainListAxiosInstance.request({
    method: 'GET',
    url: '/chains.json',
  });
  const chain = res.data.find(
    (el) => el.chain.toUpperCase() === appConfig.CHAIN.toUpperCase(),
  );

  if (!chain) {
    console.log('Chain not found');
  }

  return chain;
};
