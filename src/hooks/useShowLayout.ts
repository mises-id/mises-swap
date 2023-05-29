import { useBoolean, useCounter, useRequest } from "ahooks";

export function useShowLayout() {
  const [isShowLayout, { setTrue }] = useBoolean(false)
  const [isMaxRetrStatus, { setTrue: setMaxTrue }] = useBoolean(false)

  const [currentCount, { inc }] = useCounter(0, { min: 0, max: 30 });

  const testConnnect = async () => {
    try {
      const provider = window.ethereum.request ? window.ethereum : window.ethereum.providers.find((val: any) =>val.request)
      await provider?.request({method: 'eth_chainId'})
      // console.log(provider, 'testConnnect>>>')
      reloadPageCancel()
      setTrue()

      return 
    } catch (error: any) {
      console.log(error)
      reloadPageCancel()
      if(error.message === 'Request method eth_chainId is not supported'){
        setTrue()
      }else {
        setMaxTrue()
      }
    }
  }
  const reloadPage = async () => {
    window.location.reload()
    console.log('reloadPage')
  }

  const { cancel: reloadPageCancel, run: runReload } = useRequest(reloadPage, {
    manual: true,
    pollingWhenHidden: false,
    debounceWait: 200,
  });

  const getEthereum = async () => {
    inc()

    if(window.ethereum.providers || (window.ethereum && window.ethereum.chainId)){
      
      cancel()

      runReload()
      testConnnect()
      return 
    }

    if(currentCount === 30){
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
