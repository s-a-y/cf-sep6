import setup from '../setup'
import info from '../../src/api/info';
import deposit from '../../src/api/deposit';

setup({ worker: 'sep6', routes: [info, deposit] })
