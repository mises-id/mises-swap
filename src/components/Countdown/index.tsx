import { FC, useEffect, useState, Dispatch, SetStateAction } from 'react'

interface Iprops {
    initialHours: number, 
    initialMinutes: number, 
    initialSeconds: number,
}

const Countdown: FC<Iprops> = ({ initialHours, initialMinutes, initialSeconds }) => {
    const [hours, setHours] = useState(initialHours);
    const [minutes, setMinutes] = useState(initialMinutes);
    const [seconds, setSeconds] = useState(initialSeconds);
   
    useEffect(() => {
      if (hours === 0 && minutes === 0 && seconds === 0) return;
      const intervalId = setInterval(() => {
        if (seconds > 0) setSeconds(seconds - 1);
        else if (minutes > 0) {
          setSeconds(59);
          setMinutes(minutes - 1);
        } else {
          setMinutes(59);
          setHours(hours - 1);
        }
      }, 1000);
      return () => clearInterval(intervalId);
    }, [hours, minutes, seconds]);
   
    return (
      <div>
        {hours}:{minutes < 10 ? '0' + minutes : minutes}:{seconds < 10 ? '0' + seconds : seconds}
      </div>
    )
}

export default Countdown
