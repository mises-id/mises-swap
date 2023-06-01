import detectEthereumProvider from "@metamask/detect-provider";
import { useAsyncEffect, useBoolean, useRequest } from "ahooks";

export function useShowLayout() {
  const [isShowLayout, { setTrue }] = useBoolean(false)

  const [isMaxRetryStatus, { setTrue: setMaxTrue }] = useBoolean(false)

  const getProvider = async () => {
    const provider: any = await detectEthereumProvider()
    if (!provider) {
      setTrue()
      return 
    }

    console.log('has provider', provider)
    
    try {
      runReload()
      console.log('start connnect >>>>>>',)
      const chainId = await provider?.request({ method: 'eth_chainId', params: [] })
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
  useAsyncEffect(async () => {
    // setTimeout(() => {
      // console.log('loading....')
      // getProvider()
    // }, 1000);
    // getProvider()
    const load = () =>{
      console.log('loading')
      getProvider()
    }

    window.onload = load
  }, [])

  const reloadPage = async () => {
    const isPageReLoad = sessionStorage.getItem('isPageReLoad')

    if(isPageReLoad) {
      setMaxTrue()
      sessionStorage.removeItem('isPageReLoad')
    }else {
      sessionStorage.setItem('isPageReLoad', '1')
      window.location.reload()
    }

    // if (currentCount === max) {
    //   setMaxTrue()
    //   window.location.reload()
    //   reloadPageCancel()
    //   return
    // } else {
    //   getProvider()
    // }
    // window.location.reload()

    console.log('reloadPage-getEthereum', window.ethereum)
    console.log('reloadPage')
  }

  const { cancel: reloadPageCancel, run: runReload } = useRequest(reloadPage, {
    manual: true,
    pollingWhenHidden: false,
    debounceWait: 500,
  });

  return {
    isShowLayout,
    isMaxRetryStatus,
    getProvider
  }
}
