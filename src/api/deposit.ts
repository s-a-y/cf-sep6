import { Handler, Route } from '../@types/http'
import { logger } from '../utils/logger'
import { plainToClass } from 'class-transformer';
import { DepositDto } from './dto/deposit.dto';
import { validate } from 'class-validator';
import { UserInputError } from '../utils/http';
import assets from '../config/assets';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { BitGo } from '../services/bitgo';
import { DynamoDb } from '../services/dynamodb';
import { Stellar } from '../services/stellar';
import { MuxedAccount } from 'stellar-base';

function getExtraInfo(trusts: boolean, exists: boolean, asset: any) {
  return trusts && exists ? {} : {
    extra_info: {
      message: (exists ? `` : `Account will be funded with 8 XLM. `)
        + (trusts ? `` : `You need to establish a trustline for asset ${asset.code} to account ${asset.stellar.issuer}`),
    },
  };
}

const handler: Handler = async function ({ body, query }) {
  logger.info('/deposit')

  const dto = plainToClass(DepositDto, body || query);
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

  // check stellar account
  const muxed = dto.account.startsWith("M");
  const { trusts, exists } = await Stellar.loadAccount(
    muxed ? MuxedAccount.fromAddress(dto.account, '0').baseAccount().accountId() : dto.account,
    asset.code, asset.stellar.issuer
  );

  // if mapping exists fetch it, otherwise create new
  let mapping = await DynamoDb.getMappingByAccount(dto) || {};
  if (!mapping.addressIn) {
    mapping.addressIn = await BitGo.createAddress(asset.bitgo.coin, asset.bitgo.id, dto.address_format === 'legacy');
    await DynamoDb.createMapping({
      ...mapping,
      ...dto,
      ...(muxed? {
        memo_type: 'id',
        memo: MuxedAccount.fromAddress(dto.account, '0').id(),
      } : {})
    });
  }

  return {
    status: 200,
    statusText: `ok`,
    data: {
      how: mapping.addressIn,
      eta: asset.deposit.eta,
      min_amount: asset.deposit.min,
      // max_amount: asset.deposit.max,
      fee_fixed: asset.deposit.fee_fixed + (exists ? 0 : asset.deposit.fee_create),
      fee_percent: asset.deposit.fee_percent,
      ...getExtraInfo(trusts, exists, asset),
    } as DepositResponseDto,
  };
}

export default ['*', '/deposit', handler] as Route
