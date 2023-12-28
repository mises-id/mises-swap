import { signin } from '@/api/request';
import { useDocumentVisibility, useMount } from 'ahooks';
import { Toast } from 'antd-mobile';
import React, { FC, useEffect, useState } from 'react'
import Web3 from 'web3';

const BridgeNotification: FC = () => {
  const [penddingCount, setpenddingCount] = useState(0)

  const connect = async () => {
    const provider = (window as any).misesEthereum;
    if(provider) {
      const account = await provider.request({method: 'eth_requestAccounts', params: []})

      const timestamp = new Date().getTime();
      const address = Web3.utils.toChecksumAddress(account[0])
      const nonce = `${timestamp}`
      const sigMsg = `address=${address}&nonce=${nonce}`
      const {sig: personalSignMsg} = await provider.signMessageForAuth(address, nonce)
      const auth = `${sigMsg}&sig=${personalSignMsg}`
      const data = await signin(auth);
      localStorage.setItem('token', data.token);
      // setisLogin(true);
      setpenddingCount(0)
    } else {
      Toast.show('Please use Mises browser');
    }
  }
  // const [isLogin, setisLogin] = useState(!!localStorage.getItem('token'))
  const fetchUser = (accounts: string[]) => {
    // console.log(isLogin)
    if(accounts.length) {
      setpenddingCount(1)
    }else {
      // setisLogin(false);
      // localStorage.removeItem('token');
    }
  }
  useMount(() => {
    const provider = (window as any).misesEthereum;
    if(provider) {
      provider.on("accountsChanged", async (accounts: string[]) => {
        fetchUser(accounts)
      });
      provider.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        fetchUser(accounts)
        console.log(accounts)
      });

      provider.getCachedAuth?.().then((res: {auth: string}) => {
        console.log('getCachedAuth')
        signin(res.auth).then(data => {
          localStorage.setItem('token', data.token);
        });
      }).catch(() => {
        localStorage.removeItem('token');
      })
    }
  });
  const documentVisibility = useDocumentVisibility();
  useEffect(() => {
    if(documentVisibility === 'visible' && penddingCount === 1) {
      connect()
    }
  }, [penddingCount, documentVisibility])
  
  if(!(window as any).misesEthereum) {
    return null;
  }
  
  return (
    <div className="swap-container animate__animated animate__zoomIn" style={{zIndex: 0}}>
      <div className='flex p-10'>
        <p className='text-[16px] font-200 text-gray-500 leading-6'>Important: Cross-chain exchange service is provided by changelly.com. If you have any needs, please contact the changelly support line.</p> 
      </div>
    </div>
  )
}
export default BridgeNotification