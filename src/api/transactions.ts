import { Handler, Route } from '../@types/http'
import { logger } from '../utils/logger'
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { UnknownError, UserInputError } from '../utils/http';
import { DynamoDb } from '../services/dynamodb';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TransactionDto } from './dto/transaction.dto';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';

const handler: Handler = async function ({ query }) {
  logger.info('/transactions')

  const dto = plainToClass(TransactionsFilterDto, query);
  try {
    await validate(dto, {
      whitelist: true,
    });
  } catch (err) {
    throw new UserInputError(err.message, err.data)
  }

  const txsRaw = await DynamoDb.getTxs(dto) || [];
  let txs = [];
  for (let txRaw of txsRaw) {
    logger.info(txRaw);
    const tx = plainToClass(TransactionDto, txRaw);
    try {
      await validate(tx, {
        whitelist: true,
      });
      txs.push(tx);
    } catch (err) {
      // throw new UnknownError(err.message, err.data)
    }
  }

  return {
    status: 200,
    statusText: `ok`,
    data: { transactions: txs },
  };
}

export default ['GET', '/transactions', handler] as Route
