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
  baseURL: process.env.REACT_APP_NODE_ENV !== 'production' ? 'https://api.test.mises.site/api/v1/bridge' : 'https://api.swap.mises.site/api/v1/bridge',
  //baseURL: process.env.REACT_APP_NODE_ENV !== 'production' ? 'http://localhost:8080/api/v1/bridge' : 'https://api.swap.mises.site/api/v1/bridge',
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
