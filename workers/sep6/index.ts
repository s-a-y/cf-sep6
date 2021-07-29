import setup from '../setup'
import info from '../../src/api/info';
import deposit from '../../src/api/deposit';
import withdraw from '../../src/api/withdraw';
import transaction from '../../src/api/transaction';
import transactions from '../../src/api/transactions';

setup({ worker: 'sep6', routes: [info, deposit, withdraw, transaction, transactions] })
