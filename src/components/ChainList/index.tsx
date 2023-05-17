import { Image } from 'antd-mobile';
import { DownOutline } from 'antd-mobile-icons';
import React, { FC, useMemo } from 'react'
import './index.less'

import { useChainId } from 'wagmi'
import { Chain } from '@rainbow-me/rainbowkit';
interface IProps{
  chains: Chain[],
  chain?: {
    hasIcon: boolean;
    iconUrl?: string;
    iconBackground?: string;
    id: number;
    name?: string;
    unsupported?: boolean;
  },
  openChainModal: ()=>void
}
const ChainList: FC<IProps> = (props) => {
  const chainId = useChainId()
  
  const currentChain = useMemo(() => {
    if(props.chain) return props.chain
    
    return props.chains.find(chain => chain.id === chainId)
  }, [chainId, props.chains, props.chain])

  return (
    <div className='flex items-center current-chain' onClick={props.openChainModal}>
      <Image width={20} height={20} src={currentChain?.iconUrl as string} />
      <DownOutline className='ml-10 downoutline'/>
    </div>
  )
}
export default ChainList