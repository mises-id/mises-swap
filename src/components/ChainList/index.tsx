import { Button, Image, Mask } from 'antd-mobile';
import { CloseCircleFill, DownOutline } from 'antd-mobile-icons';
import React, { FC, useContext, useEffect, useMemo, useState } from 'react'
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
  
  const [isConnectId, setisConnectId] = useState<number | undefined>()

  const { switchNetwork } = useSwitchNetwork({
    onSuccess(data) {
      swapContext?.setChainId(data.id)
      setFalse()
      setisConnectId(undefined)
    },
    onSettled() {
      setisConnectId(undefined)
    },
  })

  const switchChain = (val: Chain) => {
    if (props.chain) {
      switchNetwork?.(val.id)
      setisConnectId(val.id)
      return 
    }
    swapContext?.setChainId(val.id)
    setFalse()
  }

  useEffect(() => {
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
        <Mask visible={isOpen} onMaskClick={() => {
          setFalse()
          setisConnectId(undefined)
        }} />
        <div className='switch-network-container'>
          <p className='switch-networks-title flex items-center justify-between'>
            <span>Switch Networks</span>
            <CloseCircleFill className='chain-close-item cursor-pointer' onClick={() => {
              setFalse()
              setisConnectId(undefined)
            }}/>
          </p>
          <div className='chain-list-scroller'>
            {chainList.map((val, index) => {
              const item = val as any
              return <div key={index}
              className={`flex gap-2 chain-item items-center cursor-pointer justify-between ${(swapContext?.chainId === val.id && !isConnectId) || isConnectId === val.id ? 'chain-active' : ''}`}
                onClick={()=>switchChain(val)}>
                <div className='flex gap-2 items-center'>
                  <Image
                    width={28}
                    height={28}
                    src={item.iconUrl}
                  />
                  <span className='network-name'>{item.name}</span>
                </div>
                {isConnectId === val.id && <div className='isconnect-loading'>connecting</div>}
              </div>
            })}
          </div>
        </div>
      </div>}
    </>
  )
}
export default ChainList