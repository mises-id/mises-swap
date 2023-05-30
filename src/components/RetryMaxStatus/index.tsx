
/*
 * @Author: lmk
 * @Date: 2022-05-25 23:57:44
 * @LastEditTime: 2022-11-16 11:46:41
 * @LastEditors: lmk
 * @Description: 
 */
import { UndoOutline } from 'antd-mobile-icons'
import './index.less'

const RetryMaxStatus = () => {
  return <div className='flex items-center justify-center h-screen'>
    <div className="text-center">
      <img src="/logo192.png" alt="logo" width={80} height={80}/>
      <div className="loadingMises">
        <p>Loading timed out</p>
        <p className="loadingMises-refreshTxt">Please try again later</p>
      </div>
      <UndoOutline className='UndoOutline cursor-pointer' onClick={()=>window.location.reload()}/>
    </div>
  </div>
}
export default RetryMaxStatus