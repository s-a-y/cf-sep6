import { DepositDto } from '../api/dto/deposit.dto';
import { dataToItem, itemToData } from 'dynamo-converters';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger'
import { WithdrawDto } from '../api/dto/withdraw.dto';
import { MemoText } from 'stellar-base';
import { TransactionFilterDto } from '../api/dto/transaction-filter.dto';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { TransactionsFilterDto } from '../api/dto/transactions-filter.dto';
import sortBy from 'lodash.sortby';
import { TransactionType } from '../api/enums/transaction-type.enum';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)

const { DynamoDBClient, QueryCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION as string,
  credentialDefaultProvider: () => {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    };
  }
});

export class DynamoDb {
  static async getMappingByAccount(dto: DepositDto) {
    try {
      const legacy = dto.address_format === 'legacy';
      const results = await client.send(new QueryCommand({
        TableName: 'apay-mapping',
        IndexName: 'account',
        ExpressionAttributeNames: { '#N': 'network-account-memo' },
        ExpressionAttributeValues: {
          ':val': {'S':`${dto.asset_code}-${dto.account}-${dto.memo_type}-${dto.memo}`},
          ':format': {'S': dto.address_format || 'default'},
        },
        KeyConditionExpression: `#N = :val`,
        FilterExpression: legacy
          ? `address_format = :format AND attribute_not_exists(transactions)`
          : `(attribute_not_exists(address_format) OR address_format = :format) AND attribute_not_exists(transactions)`,
        ScanIndexForward: false,
        Limit: 1
      }));
      if (results.Items.length > 0) {
        return itemToData(results.Items.shift());
      }
    } catch (error) {
      logger.error(error);
    }
    return null;
  }

  static async createMapping(mapping: any) {
    mapping.id = uuidv4();
    mapping['network-address'] = `${mapping.asset_code}-${mapping.addressIn}`;
    mapping['network-account-memo'] = `${mapping.asset_code}-${mapping.account}-${mapping.memo_type}-${mapping.memo}`;
    await client.send(new PutItemCommand({
      TableName: 'apay-mapping',
      Item: dataToItem(mapping),
    }))
  }

  static async getMappingByAddress(dto: WithdrawDto) {
    try {
      const results = await client.send(new QueryCommand({
        TableName: 'apay-mapping',
        IndexName: 'address',
        ExpressionAttributeNames: { '#N': 'network-address' },
        ExpressionAttributeValues: {
          ':val': {'S':`${dto.asset_code}-${dto.dest}`},
        },
        KeyConditionExpression: `#N = :val`,
        ScanIndexForward: false,
        Limit: 1
      }));
      if (results.Items.length > 0) {
        return itemToData(results.Items.shift());
      }
    } catch (error) {
      logger.error(error);
    }
    return null;
  }

  static async createMappingWithdrawal(mapping: any) {
    mapping.addressIn = mapping.dest;
    mapping.id = uuidv4();
    mapping.memo = bs58.encode(Buffer.from(mapping.id.replace(/-/g, ''), 'hex'));
    mapping.memo_type = MemoText;
    delete mapping.dest;

    mapping['network-address'] = `${mapping.asset_code}-${mapping.addressIn}`;
    mapping['network-account-memo'] = `${mapping.asset_code}-${mapping.account}-${mapping.memo_type}-${mapping.memo}`;
    await client.send(new PutItemCommand({
      TableName: 'apay-mapping',
      Item: dataToItem(mapping),
    }))
  }

  static async getTx(dto: TransactionFilterDto) {
    if (dto.stellar_transaction_id) {
      try {
        const results = await client.send(new QueryCommand({
          TableName: 'apay-txns',
          IndexName: 'stellar_tx',
          ExpressionAttributeValues: {
            ':val': {'S': `${dto.stellar_transaction_id}`},
          },
          KeyConditionExpression: `stellar_transaction_id = :val`,
          ScanIndexForward: false,
          Limit: 1
        }));
        if (results.Items.length > 0) {
          return itemToData(results.Items.shift());
        }
      } catch (error) {
        logger.error(error);
      }
    }
    if (dto.external_transaction_id) {
      try {
        const results = await client.send(new QueryCommand({
          TableName: 'apay-txns',
          IndexName: 'external_tx',
          ExpressionAttributeValues: {
            ':val': {'S': `${dto.external_transaction_id}`},
          },
          KeyConditionExpression: `external_transaction_id = :val`,
          ScanIndexForward: false,
          Limit: 1
        }));
        if (results.Items.length > 0) {
          return itemToData(results.Items.shift());
        }
      } catch (error) {
        logger.error(error);
      }
    }
    if (dto.id) {
      try {
        const results = await client.send(new GetItemCommand({
          TableName: 'apay-txns',
          Key: {
            id: {'S': `${dto.id}`}
          },
        }));
        if (results.Item) {
          return itemToData(results.Item);
        }
      } catch (error) {
        logger.error(error);
      }
    }
    return null;
  }

  static async getTxs(dto: TransactionsFilterDto) {
    const result = [];
    const limit = Math.min(dto.limit || 20, 100);
    logger.info(dto);
    try {
      if (!dto.kind || dto.kind === TransactionType.withdrawal) {
        const results1 = await client.send(new QueryCommand({
          TableName: 'apay-txns',
          IndexName: 'from',
          ExpressionAttributeNames: { '#F': 'from' },
          ExpressionAttributeValues: {
            ':val': {'S': dto.account},
            ...(dto.asset_code ? {':asset': {'S': dto.asset_code} } : {})
          },
          KeyConditionExpression: `#F = :val`,
          FilterExpression: dto.asset_code ? 'asset_code = :asset' : undefined,
          ScanIndexForward: false,
          Limit: limit,
        }));
        logger.info(results1);

        for (const res of results1.Items) {
          result.push(itemToData(res));
        }
      }
      if (!dto.kind || dto.kind === TransactionType.deposit) {
        const results2 = await client.send(new QueryCommand({
          TableName: 'apay-txns',
          IndexName: 'to_',
          ExpressionAttributeNames: { '#T': 'to' },
          ExpressionAttributeValues: {
            ':val': {'S': dto.account},
            ...(dto.asset_code ? {':asset': {'S': dto.asset_code} } : {})
          },
          KeyConditionExpression: `#T = :val`,
          FilterExpression: dto.asset_code ? 'asset_code = :asset' : undefined,
          ScanIndexForward: false,
          Limit: limit,
        }));
        logger.info(results2);
        for (const res of results2.Items) {
          result.push(itemToData(res));
        }
      }
    } catch (error) {
      logger.error(error);
    }
    return sortBy(result, '-created').slice(0, limit);
  }
}
