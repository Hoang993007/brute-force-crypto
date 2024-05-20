// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { BigNumber } from '@ethersproject/bignumber';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EtherService } from 'ether.service';
import { ethers } from 'ethers';

@Module({
  providers: [EtherService],
})
export class CrawlAddressModule {}

async function bootstrap() {
  const crawlAddressModule =
    await NestFactory.createApplicationContext(CrawlAddressModule);
  const etherService = crawlAddressModule.get(EtherService);

  const block = await etherService
    .getProvider()
    .getBlockWithTransactions(19822949);

  const transferTxs = block.transactions.filter((tx) => {
    const value = BigNumber.from(tx.value as any);
    return value.gt(ethers.parseUnits('0.1', 'ether'));
  });

  const isWalletAddress = async (address: string) => {
    const code = await await etherService.getProvider().getCode(address);
    if (code === '0x') return true;
    return false;
  };

  const setWalletAddresses = new Set<string>();
  // TODO: if detected wallet address => no need to check again
  await Promise.all(
    transferTxs.map(async (tx) => {
      if (await isWalletAddress(tx.to)) {
        setWalletAddresses.add(tx.to);
      }
      if (await isWalletAddress(tx.from)) {
        setWalletAddresses.add(tx.from);
      }
    }),
  );
  const walletAddresses = Array.from(setWalletAddresses);

  const getWalletBalance = async (address: string) => {
    const walletBalanceInWei = await etherService
      .getProvider()
      .getBalance(address);
    return ethers.formatEther(walletBalanceInWei.toString());
  };

  const detectedWalletAddress = (
    await Promise.all(
      walletAddresses.map(async (address) => {
        const balance = await getWalletBalance(address);
        if (Number(balance) < 0.1) {
          return null;
        }
        return address;
      }),
    )
  ).filter((el) => !!el);

  console.log(detectedWalletAddress);

  // TODO: Save to btree
  // TODO: test searching
}

bootstrap().catch((error) => {
  throw error;
});
