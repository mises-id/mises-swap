import { useBoolean, useCounter, useRequest } from "ahooks";

export function useShowLayout() {
  const [isShowLayout, { setTrue }] = useBoolean(false)
  const [isMaxRetrStatus, { setTrue: setMaxTrue }] = useBoolean(false)

  const [currentCount, { inc }] = useCounter(1, { min: 1, max: 50 });

  const getEthereum = async () => {
    console.log('getEthereum>>>>')
    inc()

    if(window.ethereum.providers){
      console.log(window.ethereum.providers, 'window.ethereum.providers>>>>>close')
      setTrue()
      cancel()
      return 
    }

    if(window.ethereum && window.ethereum.chainId){
      console.log(window.ethereum, 'window.ethereum>>>>>close')
      setTrue()
      cancel()
      return
    }

    if(currentCount === 50){
      cancel()
      setMaxTrue()
    }
  }

  const { cancel } = useRequest(getEthereum, {
    pollingInterval: 500,
    manual: false,
    pollingWhenHidden: false
  });

  return {
    isShowLayout,
    isMaxRetrStatus
  }

}
