import detectEthereumProvider from "@metamask/detect-provider";
import { useAsyncEffect, useBoolean, useCounter, useRequest } from "ahooks";

export function useShowLayout() {
  const [isShowLayout, { setTrue }] = useBoolean(false)
  const [isMaxRetryStatus, { setTrue: setMaxTrue }] = useBoolean(false)
  const max = 5
  const [currentCount, { inc }] = useCounter(0, { min: 0, max });
  const getProvider = async () => {
    const provider: any = await detectEthereumProvider()
    if (!provider) {
      setTrue()
    } else {
      console.log('has provider', provider)
      try {
        runReload()
        console.log('start connnect >>>>>>',)
        const chainId = await provider?.request({ method: 'eth_chainId' })
        console.log('test connnect success>>>>>>', chainId)
        setTrue()
        reloadPageCancel()
      } catch (error: any) {
        if (error.message === 'Request method eth_chainId is not supported') {
          setTrue()
          reloadPageCancel()
        }
      }
    }
  }
  useAsyncEffect(async () => {
    getProvider()
  }, [])

  const reloadPage = async () => {
    if (currentCount === max) {
      setMaxTrue()
      reloadPageCancel()
      return
    } else {
      inc()
      getProvider()
    }
    // window.location.reload()

    console.log('reloadPage-getEthereum', window.ethereum)
    console.log('reloadPage')
  }

  const { cancel: reloadPageCancel, run: runReload } = useRequest(reloadPage, {
    manual: true,
    pollingWhenHidden: false,
    debounceWait: 1000,
  });
  // ccc()
  // const testConnnect = async () => {
  //   try {
  //     const provider = window.ethereum?.request ? window.ethereum : window.ethereum?.providers.find((val: any) =>val.request)
  //     await provider?.request({method: 'eth_chainId'})
  //     // console.log(provider, 'testConnnect>>>')
  //     reloadPageCancel()
  //     setTrue()

  //     return 
  //   } catch (error: any) {
  //     console.log(error)
  //     reloadPageCancel()
  //     if(error.message === 'Request method eth_chainId is not supported'){
  //       setTrue()
  //     }else {
  //       setMaxTrue()
  //     }
  //   }
  // }

  // const getEthereum = async () => {
  //   console.log('getEthereum', window.ethereum)
  //   inc()

  //   if(window.ethereum?.providers || (window.ethereum && window.ethereum.chainId)){

  //     cancel()

  //     runReload()
  //     testConnnect()
  //     return 
  //   }

  //   if(currentCount === max){
  //     cancel()
  //     setMaxTrue()
  //   }
  // }

  // const { cancel } = useRequest(getEthereum, {
  //   pollingInterval: 500,
  //   manual: false,
  //   pollingWhenHidden: false
  // });

  return {
    isShowLayout,
    isMaxRetryStatus
  }
}
