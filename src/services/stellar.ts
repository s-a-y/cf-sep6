import { makeRequest } from '../utils/http'
import { logger } from '../utils/logger'

const baseUrl: string = process.env.HORIZON as string

export class Stellar {
  static async loadAccount(account: string, asset: string, issuer: string) {
    try {
      const res = await makeRequest(`${baseUrl}/accounts/${account}`);
      const accountLoaded = await res.json();

      if (accountLoaded.status === 404) {
        return {
          exists: false,
          trusts: false
        };
      }
      logger.info(accountLoaded);
      let trusts = false;
      for (let item of accountLoaded.balances) {
        if (item.asset_code === asset && item.asset_issuer === issuer) {
          trusts = true;
          break;
        }
      }

      return {
        exists: true,
        trusts,
      }
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}
