import { Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { ReactNode } from 'react'
//import type { MetaMask } from '@web3-react/metamask'
import { hooks as misesWalletHooks, misesWallet } from './mises'
import { MisesWallet } from './misesWallet'

const connectors: [MisesWallet, Web3ReactHooks][] = [
  [misesWallet, misesWalletHooks],
]
export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <Web3ReactProvider connectors={connectors}>
      {children}
    </Web3ReactProvider>
  )
}
