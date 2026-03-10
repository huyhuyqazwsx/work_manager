import { PrismaClient } from '@prisma/client';

type InteractiveTransaction = PrismaClient extends {
  $transaction<R>(fn: (prisma: infer T) => Promise<R>): Promise<R>;
}
  ? T
  : never;

export type PrismaTransactionClient = InteractiveTransaction;
