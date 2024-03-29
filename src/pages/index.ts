/*
 * @Author: lmk
 * @Date: 2022-05-26 20:26:08
 * @LastEditTime: 2022-09-26 15:01:04
 * @LastEditors: lmk
 * @Description: 
 */

   
import React from 'react'

export const NotFund = React.lazy(() => import('./NotFound'))
// export const Home = React.lazy(() => import('./home'))
export const Home = React.lazy(() => import('./home'))
export const HelpCenter = React.lazy(() => import('./helpCenter'))
export const Bridge = React.lazy(() => import('./bridge'))
export const BridgeTransaction = React.lazy(() => import('./bridgeTransaction'))