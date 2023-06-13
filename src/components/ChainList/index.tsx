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
    onSettled(data, error: any, variables) {
      const switchChain = chainList.find(chain => chain.id === variables.chainId)
      if(error?.name === 'SwitchChainError' || error?.details === 'May not specify default MetaMask chain.') {
        swapContext?.pushNotificationData({
          type: 'success',
          hash: `${Math.round(100)}`,
          text: 'Failed to switch networks',
          icon: ()=> <svg viewBox="0 0 16 16" fill="#B17900" xmlns="http://www.w3.org/2000/svg" className="sc-14k891g-0 eCvCkk sc-ejqhsr-2 hcxfZO"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2a1 1 0 0 1 0-2z"></path></svg>,
          description: `To use swap on ${switchChain?.name}, switch the network in your wallet's settings.`,
          noticeType: 'normal'
        })
        setFalse()
      }
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
        <Image width={20} height={20} src={currentChain?.iconUrl as string} placeholder=""/>
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