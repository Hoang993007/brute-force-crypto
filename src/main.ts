import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ethers, formatUnits } from 'ethers';
import { extractResToCsv } from 'exportCSV';
import { writeFileJson } from 'jsonFIle';
import * as _ from 'lodash';
import { getResFileName, sleep } from 'utils';
import { appConfig } from '../app/config';
import { EtherService } from './ether.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [EtherService],
})
export class AppModule {}

// NOTE: NESTJS STANDALONE APPLICATION

// TODO: RPC health check
// TODO: Ask params before run

// Lisence: give a package, and a very first lisenced
// Next will be created base on that lisense
// Run will countdown
// Print out so user can see
// Make it into a application

async function bootstrap() {
  const module = await NestFactory.createApplicationContext(AppModule);
  const etherService = module.get(EtherService);

  let count = 0;
  const start = Date.now();

  if (!etherService.network) {
    await etherService.refreshRpc();
  }

  while (!etherService.network) {
    console.log('Waiting for network data...');
    await sleep(3000);
  }

  while (true) {
    const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
    console.log('MNEMONIC: ', mnemonic.phrase);

    const data = Array.from(Array(appConfig.ADDRESS_NUM).keys()).map(
      (index) => {
        const hdWallet = ethers.HDNodeWallet.fromMnemonic(
          mnemonic,
          `m/44'/60'/0'/0/${index}`,
        );
        return {
          walletAddress: hdWallet.address,
          privateKey: hdWallet.privateKey,
        };
      },
    );

    const balances = await Promise.all(
      data.map(async (wallet, index) => {
        let balance;

        while (!balance) {
          try {
            console.log(`Chain: ${appConfig.CHAIN} | Account ${index + 1}`);
            console.log('=== Address: ', wallet.walletAddress);
            console.log('=== Private key: ', wallet.privateKey);
            balance = await etherService
              .getProvider()
              .getBalance(wallet.walletAddress);
            return formatUnits(balance.toString(), 'ether');
          } catch (err) {
            console.log('=====> Error in getting balance: retry');
          }
        }
      }),
    );

    if (_.flatten(balances).some((el) => Number(el) > 0)) {
      await writeFileJson(
        appConfig.RES_FOLDER_PATH + `/${getResFileName(mnemonic.entropy)}`,
        {
          chain: appConfig.CHAIN,
          seedPhrase: mnemonic.phrase,
          detectedBalance: _.sum(balances.map((el) => Number(el))),
        },
      );
      await extractResToCsv();
      console.log('==========> Balance detected');
    } else {
      console.log('========> No balance found');
    }
    count++;
    console.log('=== Processed: ', count);
    const diff = Date.now() - start;
    console.log('=== Speed: ', (count / (diff / 1000)).toFixed(1), 'wallet/s');
    console.log('\n');
  }
}
bootstrap();
