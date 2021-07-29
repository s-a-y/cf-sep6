import { Handler, Route } from '../@types/http'
import { logger } from '../utils/logger'
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { UnknownError, UserInputError } from '../utils/http';
import { DynamoDb } from '../services/dynamodb';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TransactionDto } from './dto/transaction.dto';

const handler: Handler = async function ({ query }) {
  logger.info('/transaction')

  const dto = plainToClass(TransactionFilterDto, query);
  try {
    await validate(dto, {
      whitelist: true,
    });
  } catch (err) {
    throw new UserInputError(err.message, err.data)
  }
  if (!dto.id && !dto.stellar_transaction_id && !dto.external_transaction_id) {
    throw new UserInputError('At least one id should be provided')
  }

  const txRaw = await DynamoDb.getTx(dto);
  logger.info(txRaw);
  const tx = plainToClass(TransactionDto, txRaw);
  try {
    await validate(tx, {
      whitelist: true,
    });
  } catch (err) {
    throw new UnknownError(err.message, err.data)
  }

  return {
    status: 200,
    statusText: `ok`,
    data: { transaction: tx },
  };
}

export default ['GET', '/transaction', handler] as Route
