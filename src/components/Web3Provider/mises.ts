import { initializeConnector } from '@web3-react/core'
import { MisesWallet } from './misesWallet'

export const [misesWallet, hooks] = initializeConnector<MisesWallet>((actions) => new MisesWallet({ actions }))