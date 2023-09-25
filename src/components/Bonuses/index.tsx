import { signin } from '@/api/request';
import { useDocumentVisibility, useMount } from 'ahooks';
import { Toast } from 'antd-mobile';
import React, { FC, useEffect, useState } from 'react'
import Web3 from 'web3';

const Bonuses: FC = () => {
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
      setisLogin(true);
      setpenddingCount(0)
    } else {
      Toast.show('Please use Mises browser');
    }
  }
  const [isLogin, setisLogin] = useState(!!localStorage.getItem('token'))
  const fetchUser = (accounts: string[]) => {
    console.log(isLogin)
    if(accounts.length) {
      setpenddingCount(1)
    }else {
      setisLogin(false);
      localStorage.removeItem('token');
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
      });
    }
  });
  const documentVisibility = useDocumentVisibility();
  useEffect(() => {
    if(documentVisibility === 'visible' && penddingCount === 1) {
      connect()
    }
  }, [penddingCount, documentVisibility])
  
  
  return (
    <div className='flex p-10'>
      <p className='text-[16px] font-200 text-gray-500 leading-6'>After logging into the Mises wallet to obtain the Mises ID, you will be eligible to earn rewards points by making swap transactions.</p> 
    </div>
  )
}
export default Bonuses