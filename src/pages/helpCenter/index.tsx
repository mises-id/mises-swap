import { Button, Collapse, Image, NavBar } from 'antd-mobile'
import React, { FC } from 'react'
import './index.less'
import { useNavigate } from 'react-router-dom'
interface IProps {

}
const HelpCenter:FC<IProps> = ()=> {
  const navigate = useNavigate()
  return (
    <div className='flex-1 flex flex-col'>
      <NavBar onBack={()=>navigate(-1)}><span>Help Center</span></NavBar>
      <div className='overflow-auto pt-10 border-solid border-t border-gray-100' style={{height: 'calc(100vh - 155px)'}}>
        <Collapse defaultActiveKey={["Guide", "Troubleshooting"]}>
          <Collapse.Panel key='Guide' title='Guide'>
            <div className='help-content'>
              <p className='font-bold text-xl mb-5'>1.What is a crypto wallet address?</p>
              <p className='font-bold mb-5 text-sm'> A crypto wallet address is the public address for your crypto wallet. Your wallet address appears as a randomly generated string of characters.</p>
              <p>You use your wallet address to send and receive cryptocurrency. This means that you can safely share your wallet address with others.</p>
              <p>You might share your wallet address with:</p>
              <ul className='list-outside'>
                <li>friends who want to send you tokens or NFTs</li>
                <li>a project you want to be on the allowlist or airdrop for Mises Swap support team</li>
              </ul>
              <p>You can also use your wallet address to find your transaction hash on a block explorer.</p>
              <p>You can find your wallet address in the crypto wallet you use.</p>
              <p className='font-bold text-xl mb-5'>2.How to connect a wallet to Mises Swap</p>
              <p className='font-bold mb-5 text-sm'>You can connect your cryptocurrency wallet to Mises Swap in a few easy steps.</p>
              <ol className="list-decimal">
                <li>Open the Mises Swap web.</li>
                <li>Select the Connect Wallet icon. </li>
                <li>Select from the available wallets.</li>
                <li>If your wallet is not listed, select “Injected Wallet” to connect the EVM wallet extension you've installed, or select Wallet Connect to choose from the list of supported wallets.</li>
              </ol>
              <p className='font-bold text-xl mb-5'>3.How to switch networks?</p>
              <p className='font-bold mb-5 text-sm'>Mises Swap supports the Ethereum, BNB Chain, Polygon, Optimism, Arbitrum, Avalanche, Fantom, Gnosis, Klaytn, Aurora and zkSync Era networks.</p>
              <p>In order to make a swap or add liquidity to tokens on a different network, you must change the network first.</p>
              <p className='font-bold mb-5 text-sm'>You can change your network by following these steps:</p>
              <ol className="list-decimal">
                <li>Select the Network icon in the upper right hand of the screen.</li>
                <li>Select the Network you would like to use.</li>
                <li>Allow the Mises Swap site to switch the Network in your Wallet. This notification will be in your wallet, or will appear on-screen.</li>
                <li>Once you switch your wallet network, confirm the network has been switched. You should see the new network name. Now, you are ready to swap!</li>
              </ol>
              <p className='font-bold text-xl mb-5'>4.How to Swap Tokens</p>
              <p className='font-bold mb-5 text-sm'>To swap tokens on Mises Swap follow these steps:</p>
              <ol className="list-decimal">
                <li>Select the tokens you wish to swap.</li>
                <li>Select the 'Select a token' icon and browse the list to find your token. You can also search by token name or token contract address.</li>
                <li>Enter the amount that you wish to swap. You can enter either your desired input amount or output amount.</li>
                <li>Approve the Mises Swap Auto Router to swap your token.</li>
                <li>If this is your wallet’s first time trading this token with Mises Swap, you need to approve the token first. 
              Review and Confirm your swap.Select the 'Swap' icon to view a preview of your swap.</li>
              </ol>
              <p className='font-bold text-xl mb-5'>5.What is a network fee?</p>
              <p className='font-bold mb-5 text-sm'>A network fee is the fee paid to the miners of the network you are using for your cryptocurrency transaction. This fee is also known as a gas fee.</p>
              <p>Every transaction on the blockchain requires a network fee. This is because miners use their own computers to verify and process transactions instead of relying on a central authority.</p>
              <p>In return, miners are compensated through network fees. Network fees also incentivizes miners to protect the network from malicious users.</p>
              <p> These fees are nonrefundable, even if your transaction fails. Miners still have to use their resources to determine that your transaction failed.</p>
              <p> The Ethereum blockchain pays miners in Ether (ETH), and is called gwei for network fees.</p>
              <p>On other blockchains, the fee is paid in that network’s native token.</p>
              <p>For example, on the Polygon blockchain, the network fees are paid in MATIC. But on the BNB blockchain, network fees are paid in BNB.</p>
              <p>The network fee you pay will vary according to the network you use.</p>
              <p>Mises Swap does not receive payment from network fees.</p>
              <p className='font-bold text-xl mb-5'>6.What is Price Slippage?</p>
              <p className='font-bold mb-5 text-sm'>Price Slippage is the change in token price caused by the total movement of the market.</p>
              <p>Price Slippage is shown as the difference between the price you expect to receive after swapping vs what you actually receive after the swap is complete.</p>
              <p className='font-bold mb-5 text-sm'>The minimum amount you receive from a trade is determined by:</p>
              <ol className="list-decimal">
                <li>Market price</li>
                <li>Slippage setting</li>
              </ol>
              <p>When you swap using the Mises Swap, you will receive the market price that is offered based on the auto slippage setting.
              The auto slippage percentage (%) will be set to be between 0.1% and 5%, depending on the network fee and swap size, designed to give you the best swap outcome.</p>
              <p>If your slippage is set too low, your transaction may revert (fail). This can cost you network fees without even completing a swap.</p>
              
              <p>If your slippage is set too high, then you may get less tokens than expected when swapping.</p>
              <p>For example, if your slippage is set to 25%, then you may receive 25% less than the expected swap outcome (tokens) that is shown to you in the swap preview.</p>
              <p className='font-bold mb-5 text-sm'>You can view the auto slippage setting in two places:</p>
              <ol className="list-decimal">
                <li>Settings menu. Select the gear icon to open the settings menu.</li>
                <li>Expanded swap details. Select the arrow to view expanded swap details. The slippage is listed as “Minimum output”.</li>
              </ol>
              <img src="/images/setting.jpg" alt="" style={{width: 280, marginBottom: 5}}/>
              <p className='font-bold text-xl mb-5'>7.How to disconnect a wallet from Mises Swap</p>
              <p className='font-bold mb-5 text-sm'>You are able to disconnect your wallet from Mises Swap when using it. </p>
              <p className='font-bold mb-5 text-sm'>To disconnect your wallet from the Mises Swap web follow these steps:</p>
              <ol className="list-decimal">
                <li>Select Wallet in top right corner</li>
                <li>Select Disconnect Wallet Icon</li>
              </ol>
              <img src="/images/historylist.jpg" alt="" style={{width: 280, marginBottom: 5}}/>
            </div>
          </Collapse.Panel>
          <Collapse.Panel key='Troubleshooting' title='Troubleshooting'>
            <div className='help-content'>
              <p className='font-bold text-xl mb-5'>1.I accidentally sent funds to the wrong address</p>
              <p className='font-bold mb-5 text-sm'>If you accidentally sent tokens to the wrong address or to a contract address, your tokens may not be recovered.</p>
              <p>Once a transaction is completed on the blockchain, it cannot be reversed or refunded.</p>
              <p className='font-bold mb-5 text-sm'>I sent my tokens to the wrong address</p>
              <p>If you know the owner of the wallet address where your funds were sent, you may reach out to them and see if they would be willing to send the tokens back to you.</p>
              <p>If you do not know the owner of the wallet address, then the tokens may not be sent back.</p>
              <p>Mises Swap is unable to help with this request. We do not collect the data of users. </p>
              <p className='font-bold mb-5 text-sm'>I sent my tokens to a contract address</p>
              <p> If you sent your tokens to a contract address, the tokens may not be recovered. This is because most contract addresses do not have a retrieval function written into their code.</p>
              <p>This makes a contract address different than a wallet address, which is designed for users to send and receive tokens.</p>
              <p>There is no function on the other end to send the tokens back in most situations.</p>
              <p className='font-bold text-xl mb-5'>2.My transaction has been pending for a long time. What can I do?</p>
              <p className='font-bold mb-5 text-sm'>If you accidentally sent tokens to the wrong address or to a contract address, your tokens may not be recovered.</p>
              <p className='font-bold mb-5 text-sm'>If your swap transaction has been pending for a long time, you have three available options.</p>
              <ul className='list-outside'>
                <li>Wait — Mises Swap will submit your transaction to the blockchain and queue it according to your gas fee amount, please wait patiently until the transaction is completed</li>
                <li>Speed up — wallets can offer users the ability to speed up their transactions by re-submitting them with a higher gas price. This is not necessarily guaranteed to work. <a className="text-blue-600 after:content-['_↗']" href="https://support.metamask.io/hc/en-us/articles/360015489251-How-to-Speed-Up-or-Cancel-a-Pending-Transaction" target="_blank" rel="noreferrer"> Metamask guide</a></li>
                <li>Cancel — wallets can also offer users the ability to cancel their transactions by submitting an ‘empty’ transaction with a higher gas price. This is not necessarily guaranteed to work. <a className="text-blue-600 after:content-['_↗']" href="https://support.metamask.io/hc/en-us/articles/360015489251-How-to-Speed-Up-or-Cancel-a-Pending-Transaction" target="_blank" rel="noreferrer"> Metamask guide</a></li>
              </ul>
              <p>Note that all three options will have an associated transaction fee.</p>
              <p className='font-bold text-xl mb-5'>Why did my transaction fail?</p>
              <p className='font-bold mb-5 text-sm'>here are several reasons why a transaction can fail. Slippage Limits</p>
              <p>The Mises Swap sets a default slippage limit of 0.1%. This slippage limit is the different between your expected output and the real output at the time of your swap. If the real output changes by more than your set slippage, the transaction will fail.</p>
              <p className='font-bold mb-5 text-sm'>here are several reasons why a transaction can fail. Slippage Limits</p>
              <p>The Mises Swap sets a default slippage limit of 0.1%. This slippage limit is the different between your expected output and the real output at the time of your swap. If the real output changes by more than your set slippage, the transaction will fail.</p>
              <p>At your own risk, you can adjust the slippage limits in ‘Transaction settings.’</p>
              <p className='font-bold mb-5 text-sm'>Insufficient Funds</p>
              <p>The Mises Swap sets a default slippage limit of 0.1%. This slippage limit is the different between your expected output and the real output at the time of your swap. If the real output changes by more than your set slippage, the transaction will fail.</p>
              <p>If you do not have enough of your network’s native token to cover the network fees, you will not be able to execute a transaction. Each transaction requires this network fee to execute a transaction.</p>
              <p>You can purchase more of your networks native token, adjust your swap amount, or wait for network fees to drop.</p>
              <p className='font-bold text-xl mb-5'>The Mises Swap web app fails to load</p>
              <p className='font-bold mb-5 text-sm'>If you are having trouble loading the Mises Swap web app, there are a few steps you can take to troubleshoot:</p>
              <ol className="list-decimal">
                <li>Reload the website.</li>
                <li>Clear the cache of your internet browser on your browser</li>
                <li>Restart your device</li>
                <li>Try again in a few minutes. The Mises Swap web app may be having issues, and we are working on fixing it.</li>
              </ol>
              <p>If these steps do not work, please reach out to our support team at DisCord channel: <a className="text-blue-600 after:content-['_↗']" href="https://discord.gg/EPYKVD54X8" target="_blank" rel="noreferrer">https://discord.gg/EPYKVD54X8</a></p>
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
      <div className='flex-none p-10'>
        <p className='text-center mb-10 text-gray-500'>If the problem cannot be solved, please contact us</p>
        <Button block color='primary'>
          <div className='flex items-center justify-center' style={{height: 30}}>
            <Image
              width={25}
              placeholder=""
              src='/images/discord.svg'
            />
            <span className='ml-4'>Discord</span>
          </div>
        </Button>
      </div>
    </div>
  )
}

export default HelpCenter