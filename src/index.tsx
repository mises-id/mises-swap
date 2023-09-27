/*
 * @Author: lmk
 * @Date: 2022-06-13 14:30:44
 * @LastEditTime: 2022-09-14 17:59:30
 * @LastEditors: lmk
 * @Description: 
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/global.css'
import reportWebVitals from './reportWebVitals';
import './locales'

import * as Sentry from "@sentry/react";
import VConsole from 'vconsole';
import { isIOS } from './utils';
import 'animate.css';

Sentry.init({
  enabled: process.env.NODE_ENV==='production',
  dsn:
    "https://ec50b87155004205a00c17ca905229ee@o1162849.ingest.sentry.io/4505243739619329",
  integrations: [new Sentry.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  ignoreErrors:['UnhandledRejection', 'WebSocket connection'],
});

if(process.env.REACT_APP_NODE_ENV === 'test' && isIOS()) {
  new VConsole();
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
