import { Handler, Route } from '../@types/http'
import { logger } from '../utils/logger'
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { UserInputError } from '../utils/http';
import assets from '../config/assets';
import { BitGo } from '../services/bitgo';
import { DynamoDb } from '../services/dynamodb';
import { WithdrawDto } from './dto/withdraw.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';

const handler: Handler = async function ({ body, query }) {
  logger.info('/withdraw')

  const dto = plainToClass(WithdrawDto, body || query);
  try {
    await validate(dto, {
      whitelist: true,
    });
  } catch (err) {
    throw new UserInputError(err.message, err.data)
  }
  const asset = assets.find(item => item.code === dto.asset_code);
  if (!asset) {
    throw new UserInputError('Unknown asset', { asset: dto.asset_code })
  }

  // validate destination
  const validDest = await BitGo.validateAddress(asset.bitgo.coin, dto.dest);
  if (!validDest) {
    throw new UserInputError('Invalid destination address', { dest: dto.dest });
  }

  // if mapping exists fetch it, otherwise create new
  // todo: are there privacy concerns if we show stellar account by deposit address
  let mapping = await DynamoDb.getMappingByAddress(dto) || {};
  if (!mapping.addressIn) {
    mapping.account = asset.stellar.distributor;
    await DynamoDb.createMappingWithdrawal({
      ...mapping,
      ...dto,
    });
  }

  return {
    status: 200,
    statusText: `ok`,
    data: {
      account_id: mapping.account,
      memo_type: mapping.memo_type,
      memo: mapping.memo,
      eta: asset.withdraw.eta,
      min_amount: asset.withdraw.min,
      // max_amount: asset.deposit.max,
      fee_fixed: asset.withdraw.fee_fixed,
      fee_percent: asset.withdraw.fee_percent,
    } as WithdrawalResponseDto,
  };
}

export default ['*', '/withdraw', handler] as Route
