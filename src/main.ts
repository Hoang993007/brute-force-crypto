import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { EtherService } from './ether.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [EtherService],
})
export class AppModule {}

async function bootstrap() {
  const module = await NestFactory.createApplicationContext(AppModule);
  const etherService = module.get(EtherService);

  const res = await etherService
    .getProvider()
    .getTransactionReceipt(
      '0x5edac8e53e0583e1ebb9ddcd27eeed479bdd6c25dea13ab38442bd5a537b0fe7',
    );
  console.log(res);
}
bootstrap();
