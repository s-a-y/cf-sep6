import { DepositDto } from '../api/dto/deposit.dto';
import { dataToItem, itemToData } from 'dynamo-converters';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger'

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
          ...(legacy ? {':format': {'S':`legacy`}} : {}),
        },
        KeyConditionExpression: `#N = :val`,
        FilterExpression: legacy
          ? `address_format = :format AND attribute_not_exists(transactions)`
          : `attribute_not_exists(address_format) AND attribute_not_exists(transactions)`,
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

  static async saveMapping(mapping: any) {
    mapping.id = uuidv4();
    mapping['network-address'] = `${mapping.asset_code}-${mapping.addressIn}`;
    mapping['network-account-memo'] = `${mapping.asset_code}-${mapping.account}-${mapping.memo_type}-${mapping.memo}`;
    await client.send(new PutItemCommand({
      TableName: 'apay-mapping',
      Item: dataToItem(mapping),
    }))
  }
}
