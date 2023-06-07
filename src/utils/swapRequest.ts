/*
 * @Author: lmk
 * @Date: 2022-05-05 20:50:25
 * @LastEditTime: 2022-10-14 11:42:19
 * @LastEditors: lmk
 * @Description:
 */
import { Toast } from 'antd-mobile';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
const headers:{[key: string]: string} = {
  'Content-Type': 'application/json'
}
// if(istest){
//   headers['Mises-Env'] = 'development'
// }
// 

const request = axios.create({
  headers,
  baseURL: process.env.REACT_APP_NODE_ENV !== 'production' ? 'https://api.test.mises.site/api/v1/swap' : 'https://api.swap.mises.site/api/v1/swap',
  timeout: 5000,
});

// add request interceptors
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    return config;
  },
  function (error:any) {
    return Promise.reject(error);
  },
);

// add response interceptors
request.interceptors.response.use((response: AxiosResponse) => {
  const { data } = response;
  if (response.status === 200) return response;
  Toast.show(data.msg);
  return Promise.reject(data);
},err=>{
  const { data } = err?.response || {};
  return Promise.reject(data || err);
});

export default request;
