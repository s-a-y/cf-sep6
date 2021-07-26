export default [
  {
    bitgo: {
      id: process.env.BITGO_WALLET_BTC as string,
      coin: 'btc'
    },
    code: 'BTC',
    deposit: {
      eta: 1200,
      min: 0.0001,
      fee_create: 0.0001,
      fee_fixed: 0.0,
      fee_percent: 0.0
    },
    stellar: {
      issuer: ''
    }
  },
  {
    bitgo: {
      id: process.env.BITGO_WALLET_TBTC as string,
      coin: 'tbtc'
    },
    code: 'TBTC',
    deposit: {
      eta: 1200,
      min: 0.0001,
      fee_create: 0.0001,
      fee_fixed: 0.0,
      fee_percent: 0.0
    },
    stellar: {
      issuer: ''
    }
  }
]
