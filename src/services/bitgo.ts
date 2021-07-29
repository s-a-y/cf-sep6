import { makeRequest } from '../utils/http'
import { logger } from '../utils/logger'

const authToken: string = process.env.BITGO_ACCESS_TOKEN as string
const baseUrl: string = process.env.BITGO_EXPRESS as string

export class BitGo {
  static async createAddress(coin: string, id: string, legacy: boolean = false) {
    return makeRequest(`${baseUrl}/api/v2/${coin}/wallet/${id}/address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        chain: legacy ? 10 : 20
      }
    }).then(res => res.address);
  }

  static async wallet(coin: string, id: string) {
    return makeRequest(`${baseUrl}/api/v2/${coin}/wallet/${id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
  }

  static async validateAddress(coin: string, dest: string): Promise<boolean> {
    return makeRequest(`${baseUrl}/api/v2/${coin}/verifyaddress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        address: dest
      }
    }).then(res => res.isValid);
  }
}
