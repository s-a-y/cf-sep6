import { Handler, Route } from '../@types/http'
import { logger } from '../utils/logger'

const handler: Handler = async function ({ body }) {
  logger.info('/info')

  return {
    status: 200,
    statusText: `ok`,
    data: {
      deposit: {
        BTC: {enabled: true, fee_fixed: 0, min_amount: 0.0002},
        DASH: {enabled: false, fee_fixed: 0, min_amount: 0.003},
        LTC: {enabled: true, fee_fixed: 0, min_amount: 0.01},
        ETH: {enabled: true, fee_fixed: 0, min_amount: 0.001},
        BAT: {enabled: true, fee_fixed: 0, min_amount: 2},
        KIN: {enabled: false, fee_fixed: 0, min_amount: 0},
        LINK: {enabled: true, fee_fixed: 0, min_amount: 1},
        USDT: {enabled: true, fee_fixed: 0, min_amount: 1},
        TBTC: {enabled: true, fee_fixed: 0, min_amount: 0.0001},
      },
      withdraw:{
        BTC:{enabled:true, fee_fixed:0.0001, fee_percent:0.1, min_amount:0.0002, types:{crypto:{}}},
        DASH:{enabled:false, fee_fixed:0.006, fee_percent:0.1, types:{crypto:{}}},
        LTC:{enabled:true, fee_fixed:0.01, fee_percent:0.1, min_amount:0.02, types:{crypto:{}}},
        ETH:{enabled:true, fee_fixed:0.003, fee_percent:0.1, min_amount:0.006, types:{crypto:{}}},
        BAT:{enabled:true, fee_fixed:10, fee_percent:0.1, min_amount:20, types:{crypto:{}}},
        KIN:{enabled:true, fee_fixed:0, fee_percent:0.1, min_amount:0, types:{crypto:{}}},
        LINK:{enabled:true, fee_fixed:0.1, fee_percent:0.1, min_amount:0.2, types:{crypto:{}}},
        USDT:{enabled:true, fee_fixed:3, fee_percent:0.1, min_amount:6, types:{crypto:{}}},
        TBTC:{enabled:true, fee_fixed:0.0001, fee_percent:0.1, min_amount: 0.0002, types:{crypto:{}}}
      },
      fee: {
        enabled: false,
      },
      transactions:{
        enabled: true,
        authentication_required: false,
      },
      transaction:{
        enabled: true,
        authentication_required: false,
      }
    },
  };
}

export default ['GET', '/info', handler] as Route
