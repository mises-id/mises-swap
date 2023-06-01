
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

export const useAnalytics = ()=>{
  const firebaseConfig = {
    apiKey: "AIzaSyBYay2H1124NUZaql0Hn1J_saDT3mtLkEc",
    authDomain: "mises-swap.firebaseapp.com",
    projectId: "mises-swap",
    storageBucket: "mises-swap.appspot.com",
    messagingSenderId: "84010476360",
    appId: "1:84010476360:web:dcc167e3e5df66fcb9097d",
    measurementId: "G-20B48Y5GN1"
  };
  const app = initializeApp(firebaseConfig)
  const analytics = getAnalytics(app)
  return analytics
}