import "./index.less";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, Toast } from "antd-mobile";
import Countdown from "@/components/Countdown";
import { retryRequest } from "@/utils";
import { getBridgeTransactionInfo } from "@/api/bridge";

interface getBridgeTransactionInfoResult {
    id: string,
    trackUrl: string,
    createdAt: number,
    expireHour: number,
    expireMinute: number,
    expireSecond: number,
    type: string,
    moneyReceived: number,
    moneySent: number,
    rate: string,
    payinConfirmations: string,
    status:string,
    currencyTo: string,
    currencyFrom: string,
    payinAddress: string,
    payinExtraId: string,
    payinExtraIdName: string,
    payinHash	: string,
    payoutAddress: string,
    payoutExtraId: string,
    payoutExtraIdName: string,
    payoutHash: string,
    payoutHashLink: string,
    refundAddress: string,
    refundExtraId: string,
    refundHash: string,
    refundHashLink: string,
    amountExpectedFrom: string,
    amountExpectedTo: string,
    amountFrom: string,
    amountTo	: string,
    networkFee: string,
    changellyFee: string,
    apiExtraFee: string,
    totalFee: string,
    canPush: boolean,
    canRefund: boolean
}

const TransactionStatusMap = new Map([
    ['new', 'Transaction is waiting for an incoming payment.'],
    ['waiting', 'Transaction is waiting for an incoming payment.'],
    ['confirming', 'Our cex partner has received payin and is waiting for certain amount of confirmations depending on the incoming currency.'],
    ['exchanging', 'Payment was confirmed and is being exchanged.'],
    ['sending', 'Coins are being sent to the recipient address.'],
    ['finished', 'Coins were successfully sent to the recipient address.'],
    ['failed', 'Transaction has failed. Please contact support and provide a transaction ID.'],
    ['refunded', 'Exchange failed and coins were refunded to your wallet.'],
    ['hold', 'Due to AML/KYC procedure, exchange may be delayed. Please contact support and provide a transaction ID.'],
    ['overdue', 'Payin for floating rate transaction was not sent within the indicated timeframe.'],
    ['expired', 'Payin for fixed rate transaction was not sent within the indicated timeframe.']
]);

const BridgeTransaction = () => {
    const navigate = useNavigate()
    const {transId} = useParams<string>()
    const [status, setStatus] = useState("")
    const [expireHour, setExpireHour] = useState<number>(0)
    const [expireMinute, setExpireMinute] = useState<number>(0)
    const [expireSecond, setExpireSecond] = useState<number>(0)
    const [currencyFromTicker, setCurrencyFromTicker] = useState("")
    const [currencyToTicker, setCurrencyToTicker] = useState("")
    const [amountFrom, setAmountFrom] = useState("")
    const [amountTo, setAmountTo] = useState("")
    const [amountExpectedFrom, setAmountExpectedFrom] = useState("")
    //const [amountExpectedTo, setAmountExpectedTo] = useState("")
    const [payinAddress, setPayinAddress] = useState("")
    const [payinExtraIdName, setPayinExtraIdName] = useState("")
    const [payinExtraId, setPayinExtraId] = useState("")
    const [payoutAddress, setPayoutAddress] = useState("")
    const [payoutExtraId, setPayoutExtraId] = useState("")
    const [payoutExtraIdName, setPayoutExtraIdName] = useState("")
    const [refundAddress, setRefundAddress] = useState("")
    const [networkFee, setNetworkFee] = useState("")
    //const [totalFee, setTotalFee] = useState("")

    // init
    
    const getBridgeTransactionInfoWithRetry = retryRequest(getBridgeTransactionInfo)
    const refreshTransactionInfo = async (intervalId: number) => {
        if(!transId){
            return
        }
        try{
            // get transaction info
            const ret = await getBridgeTransactionInfoWithRetry<{data:getBridgeTransactionInfoResult}, {id: string}>({id: transId})
            if(!ret.data.data || Object.keys(ret.data.data).length === 0 || !ret.data.data.status){
                throw new Error("transaction info error")
            }
            // update states
            setStatus(ret.data.data.status)
            setCurrencyFromTicker(ret.data.data.currencyFrom)
            setCurrencyToTicker(ret.data.data.currencyTo)
            setAmountExpectedFrom(ret.data.data.amountExpectedFrom)
            setAmountFrom(ret.data.data.amountFrom)
            setAmountTo(ret.data.data.amountTo)
            setPayinAddress(ret.data.data.payinAddress)
            setPayoutAddress(ret.data.data.payoutAddress)
            setRefundAddress(ret.data.data.refundAddress)
            setNetworkFee(ret.data.data.networkFee)
            // setTotalFee(ret.data.data.totalFee)
            if(ret.data.data.expireHour){
                setExpireHour(ret.data.data.expireHour)
            }
            if(ret.data.data.expireMinute){
                setExpireMinute(ret.data.data.expireMinute)
            }
            if(ret.data.data.expireSecond){
                setExpireSecond(ret.data.data.expireSecond)
            }
            setPayinExtraIdName(ret.data.data.payinExtraIdName)
            setPayinExtraId(ret.data.data.payinExtraId)
            setPayoutExtraIdName(ret.data.data.payoutExtraIdName)
            setPayoutExtraId(ret.data.data.payoutExtraId)
            if(!intervalId && ["finished","failed","refunded","overdue","expired"].includes(ret.data.data.status)) {
                clearInterval(intervalId)
            }
        } catch (err) {
            if(status === ""){
                setStatus("error")
            }
            console.error("getBridgeTransactionInfoWithRetry:", err)
            return
        }
    }
    
    useEffect(() => {
        const intervalId = setInterval(refreshTransactionInfo, 30000)
        refreshTransactionInfo(intervalId)
        return () => clearInterval(intervalId);
        // eslint-disable-next-line
    }, [])

    // check status
    if (status === "") {
        return null
    } else if(status === "error") {
        return (
            <div className="flex flex-col flex-1">
                <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
                    <div className="relative flex" onClick={() => navigate('/bridge')}>
                        <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
                        <div><span className="beta-tag">BETA</span></div>
                    </div>
                </div>
                <div className='flex-1 flex flex-col overflow-hidden relative'>
                    <div className="bridge-swap-container">
                        <div className="flex justify-center items-center">
                            <h2>Failed to get transaction information, please refresh the page to try again.</h2>
                        </div>
                        <div className="flex justify-between items-center">
                            <Button color="primary" onClick={() => window.location.reload()}>Refresh</Button>
                            <Button color="primary" onClick={() => {navigate("/bridge")}}>Back to main page</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if(status === "confirming" || status === "exchanging" || status === "sending"){
        return (
            <div className="flex flex-col flex-1">
                <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
                    <div className="relative flex" onClick={() => navigate('/bridge')}>
                        <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
                        <div><span className="beta-tag">BETA</span></div>
                    </div>
                </div>
                <div className='flex-1 flex flex-col overflow-hidden relative'>
                    <div className="bridge-swap-container">
                        <div className="flex justify-center items-center">
                            <h2 className="bridge-with-underline">{status}</h2>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Transaction ID</div>
                            <div className="bridge-transaction-detail-content">{transId}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Status</div>
                            <div className="bridge-transaction-detail-content">{status}</div>
                            <div className="bridge-transaction-detail-tip">{TransactionStatusMap.get(status)}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">You send</div>
                            <div className="bridge-transaction-detail-content">{amountFrom} {currencyFromTicker}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">You'll get</div>
                            <div className="bridge-transaction-detail-content">{amountTo} {currencyToTicker}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Recipient address</div>
                            <div className="bridge-transaction-detail-content">{payoutAddress}</div>
                        </div>
                        { payoutExtraId && 
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">{payoutExtraIdName}</div>
                            <div className="bridge-transaction-detail-content">{payoutExtraId}</div>
                        </div>
                        }
                    </div>
                </div>
            </div>
        )
    } else if(status === "failed" || status === "hold" || status === "refunded") {
        return (
            <div className="flex flex-col flex-1">
                <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
                    <div className="relative flex" onClick={() => navigate('/bridge')}>
                        <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
                        <div><span className="beta-tag">BETA</span></div>
                    </div>
                </div>
                <div className='flex-1 flex flex-col overflow-hidden relative'>
                    <div className="bridge-swap-container">
                        <div className="flex justify-center items-center">
                            <h2 className="bridge-with-underline">{status}</h2>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Transaction ID</div>
                            <div className="bridge-transaction-detail-content">{transId}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Status</div>
                            <div className="bridge-transaction-detail-content">{status}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Message</div>
                            <div className="bridge-transaction-detail-content">{TransactionStatusMap.get(status)}</div>
                        </div>
                        {status === "refunded" && <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Refund address</div>
                            <div className="bridge-transaction-detail-content">{refundAddress}</div>
                        </div>}
                    </div>
                </div>
            </div>
        )
    } else if(status === "finished") {
        return (
            <div className="flex flex-col flex-1">
                <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
                    <div className="relative flex" onClick={() => navigate('/bridge')}>
                        <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
                        <div><span className="beta-tag">BETA</span></div>
                    </div>
                </div>
                <div className='flex-1 flex flex-col overflow-hidden relative'>
                    <div className="bridge-swap-container">
                        <div className="flex justify-center items-center">
                            <h2 className="bridge-with-underline">{status}</h2>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Transaction ID</div>
                            <div className="bridge-transaction-detail-content">{transId}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Status</div>
                            <div className="bridge-transaction-detail-content">{status}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">You send</div>
                            <div className="bridge-transaction-detail-content">{amountFrom} {currencyFromTicker}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">You get</div>
                            <div className="bridge-transaction-detail-content">{amountTo} {currencyToTicker}</div>
                        </div>
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Recipient address</div>
                            <div className="bridge-transaction-detail-content">{payoutAddress}</div>
                        </div>
                        { payoutExtraId && 
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">{payoutExtraIdName}</div>
                            <div className="bridge-transaction-detail-content">{payoutExtraId}</div>
                        </div>
                        }
                        <div className="bridge-transaction-detail-block">
                            <div className="bridge-transaction-detail-title">Network fee</div>
                            <div className="bridge-transaction-detail-content">{networkFee}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1">
    <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
        <div className="relative flex" onClick={() => navigate('/bridge')}>
            <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
            <div><span className="beta-tag">BETA</span></div>
        </div>
    </div>
        <div className='flex-1 flex flex-col overflow-hidden relative'>
      <div className="bridge-swap-container">
        <div>
            <div className="flex justify-center items-center">
              <h2 className="bridge-with-underline">Send funds to the address below</h2>
            </div>
            <div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Amount</div>
                <div className="bridge-transaction-detail-content">{amountExpectedFrom} {currencyFromTicker}</div>
              </div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Changelly Address ({currencyFromTicker})</div>
                <div className="bridge-transaction-detail-content">{payinAddress}</div>
                <Button
                onClick={() => {
                    navigator.clipboard.writeText(payinAddress)
                        .then(() => {
                            Toast.show('Copied to clipboard!')
                        })
                        .catch((err) => {
                            Toast.show(err)
                        })
                }}
                block
                color="primary"
                className='bridge-copy-button'>Copy Changelly Address</Button>
              </div>
            </div>
            {   payinExtraId && 
                <div>
                <div className="bridge-transaction-detail-block">
                    <div className="bridge-transaction-detail-title">{payinExtraIdName}</div>
                    <div className="bridge-transaction-detail-content">{payinExtraId}</div>
                    <Button
                    onClick={async () => {
                        navigator.clipboard.writeText(payinExtraId)
                            .then(() => {
                                Toast.show('Copied to clipboard!')
                            })
                            .catch((err) => {
                                Toast.show(err)
                            })
                    }}
                    block
                    color="primary"
                    className='bridge-copy-button'>Copy {payinExtraIdName}</Button>
                </div>
                </div>
            }
        </div>
      </div>

        <div className="bridge-swap-container">
            <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-content">
                    <Countdown initialHours={expireHour} initialMinutes={expireMinute} initialSeconds={expireSecond} />
                </div>
                <div className="bridge-transaction-detail-title">Time left to send {amountExpectedFrom} {currencyFromTicker}</div>
                {(status === "expired" || status === "overdue") &&
                <div>
                    <Button
                    onClick={()=>{
                        navigate('/bridge/process')
                    }}
                    block
                    color="primary"
                    className='bridge-copy-button'>Start over</Button>
                </div>
                }
            </div>
            <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-content">{transId}</div>
                <div className="bridge-transaction-detail-title">Transaction ID</div>
            </div>
        </div>
      </div>
    </div>
    )
}

export default BridgeTransaction