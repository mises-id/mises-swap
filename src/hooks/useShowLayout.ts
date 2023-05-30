import detectEthereumProvider from "@metamask/detect-provider";
import { useAsyncEffect, useBoolean, useRequest } from "ahooks";

export function useShowLayout() {
  const [isShowLayout, { setTrue }] = useBoolean(false)
  const [isMaxRetryStatus, { setTrue: setMaxTrue }] = useBoolean(false)
  // const max = 20
  // const [currentCount, { inc }] = useCounter(0, { min: 0, max });

  useAsyncEffect(async ()=>{
    const provider: any = await detectEthereumProvider()
    if(!provider) {
      setTrue()
    }else {
      console.log('has provider', provider)
      runReload()
      await provider?.request({method: 'eth_chainId'})
      setTrue()
      reloadPageCancel()
    }
  }, [])
  
  const reloadPage = async () => {
    // window.location.reload()
    setMaxTrue()
    console.log('reloadPage-getEthereum', window.ethereum)
    console.log('reloadPage')
  }

  const { cancel: reloadPageCancel, run: runReload } = useRequest(reloadPage, {
    manual: true,
    pollingWhenHidden: false,
    debounceWait: 2000,
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
