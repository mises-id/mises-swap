//import "./index.less";
import { useEffect } from "react";
import { getHistoryList } from "@/api/bridge";
import { retryRequest } from "@/utils";
import { useRequest } from "ahooks";

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
    const getHistoryListRetry = retryRequest(getHistoryList)
    const getBridgeHistoryList = async () => {
        if(props.token === ""){
            return
        }
        console.log(`props.token:${props.token}`)
        const ret = await getHistoryListRetry<{data:getBridgeHistoryListResult[]}, getBridgeHistoryListParams>({page:1, limit:20})
        if(ret.data.data.length > 0){
            console.log(`props.token:length:${ret.data.data.length}`)
        }
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
    return null
}

export default BridgeHistoryList