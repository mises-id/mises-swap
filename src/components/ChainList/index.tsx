import { Button, Image, Mask } from 'antd-mobile';
import { CloseCircleFill, DownOutline } from 'antd-mobile-icons';
import React, { FC, useContext, useEffect, useMemo } from 'react'
import './index.less'

import { useChainId, useSwitchNetwork } from 'wagmi'
import { Chain } from '@rainbow-me/rainbowkit';
import { useBoolean } from 'ahooks';
import { chainList } from '@/App';
import { SwapContext } from '@/context/swapContext';
interface IProps {
  chains: Chain[],
  chain?: {
    hasIcon: boolean;
    iconUrl?: string;
    iconBackground?: string;
    id: number;
    name?: string;
    unsupported?: boolean;
  },
  openChainModal: () => void
}
const ChainList: FC<IProps> = (props) => {
  const chainId = useChainId()
  const [isOpen, { setTrue, setFalse }] = useBoolean(false);
  const swapContext = useContext(SwapContext)

  const currentChain: any = useMemo(() => {
    if (props.chain) return props.chain

    return chainList.find(chain => chain.id === (props.chain ? chainId : swapContext?.chainId))
    // eslint-disable-next-line
  }, [chainId, props.chain, swapContext?.chainId])
  
  const { switchNetwork } = useSwitchNetwork()
  const switchChain = (val: Chain) => {
    swapContext?.setChainId(val.id)
    if (props.chain) {
      switchNetwork?.(val.id)
    }
    setFalse()
  }

  useEffect(() => {
    console.log(props.chain)
    if(props.chain?.id) swapContext?.setChainId(props.chain?.id)
    // eslint-disable-next-line
  }, [props.chain])
  

  return (
    <>
      {currentChain?.iconUrl && <div className='flex items-center current-chain' onClick={setTrue}>
        <Image width={20} height={20} src={currentChain?.iconUrl as string} />
        <DownOutline className='ml-10 downoutline' />
      </div>}

      {!currentChain.iconUrl && <Button color='danger' size='small' shape='rounded' onClick={setTrue}>
        Wrong Network
      </Button>}

      {isOpen && <div>
        <Mask visible={isOpen} onMaskClick={() => setFalse()} />
        <div className='switch-network-container'>
          <p className='switch-networks-title flex items-center justify-between'>
            <span>Switch Networks</span>
            <CloseCircleFill className='chain-close-item cursor-pointer' onClick={() => setFalse()}/>
          </p>
          <div className='chain-list-scroller'>
            {chainList.map((val, index) => {
              const item = val as any
              return <div key={index}
                className={`flex gap-2 chain-item items-center cursor-pointer ${swapContext?.chainId === val.id ? 'chain-active' : ''}`}
                onClick={()=>switchChain(val)}>
                <Image
                  width={28}
                  height={28}
                  src={item.iconUrl}
                />
                <span>{item.name}</span>
              </div>
            })}
          </div>
        </div>
      </div>}
    </>
  )
}
export default ChainList