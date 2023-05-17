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
const request = axios.create({
  headers,
  baseURL: ' https://www.oklink.com/',
  timeout: 10000,
});

// add request interceptors
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if(!config.headers){
      config.headers = {}
    }
    config.headers['Ok-Access-Key'] = "b514fd88-5896-42a4-83ad-3635e69d09f5"
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
  const { data } = err?.response;
  return Promise.reject(data);
});

export default request;
