import "./index.less";
import { useEffect, useState } from "react";
import { getHistoryList } from "@/api/bridge";
import { retryRequest } from "@/utils";
import { useRequest } from "ahooks";
import { Link } from "react-router-dom";

interface getBridgeHistoryListResult {
    id:           string
    status:       string
    createdAt:    number
    currencyFrom: string
    amountFrom:   string
    currencyTo:   string
    amountTo:     string
    trackUrl:     string
}

interface getBridgeHistoryListParams {
    page: number
    limit: number
}

interface Iprops {
    token: string
}

const BridgeHistoryList = (props:Iprops) => {
    const [historyList, setHistoryList] = useState<getBridgeHistoryListResult[]>([])

    const getHistoryListRetry = retryRequest(getHistoryList)
    const getBridgeHistoryList = async () => {
        if(props.token === ""){
            setHistoryList([])
            return
        }
        const ret = await getHistoryListRetry<{data:getBridgeHistoryListResult[]}, getBridgeHistoryListParams>({page:1, limit:20})
        if(ret.data.data && ret.data.data.length > 0){
            console.log(`props.token:length:${ret.data.data.length}`)
            setHistoryList(ret.data.data)
        }else{
            setHistoryList([])
        }
        return
    }
    const {run: runRefresh} = useRequest(
        getBridgeHistoryList,
        {
            manual: true,
            pollingInterval: 60000,
            pollingWhenHidden: false,
        }
    )

    // eslint-disable-next-line
    useEffect(
        runRefresh,
        [props.token]
    )
    
    if(historyList.length === 0){
        return null
    }
    
    return (
        <div className="bridge-swap-container">
            <table>
                <thead>
                    <tr>
                        <th>Created at</th>
                        <th>Exchange info</th>
                        <th>Transaction ID</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                  {
                    historyList.map((object, i) => 
                        <tr>
                        <td>{object.createdAt}</td>
                        <td>{object.amountFrom} {object.currencyFrom} ~ {object.amountTo} {object.currencyTo}</td>
                        <td><Link to={`/bridge/transaction/${object.id}`}>{object.id}</Link></td>
                        </tr>
                    )
                  }
                </tbody>
            </table>
        </div>
    )
}

export default BridgeHistoryList