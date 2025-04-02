import React, { useEffect, useState, useRef } from "react";
import { useAppSelector } from "../../hooks";
import { useTimer } from "react-timer-hook";
import classes from "./exam-timer.module.scss";

interface ExamTimerProps {
  onTimerEnd: () => void;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ onTimerEnd }) => {
  const activeExam = useAppSelector((state) => state.exam.activeExam);
  const [expiryTimestamp, setExpiryTimestamp] = useState<Date>(() => {
    // Initialize with a safe default (30 minutes from now)
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 30);
    return defaultDate;
  });

  // Use a ref to track if timer has already expired to prevent multiple calls
  const hasExpiredRef = useRef(false);

  // Set up the timer correctly when the component mounts or when activeExam changes
  useEffect(() => {
    if (activeExam && activeExam.expiresOn) {
      // Create a new Date object from the timestamp
      const expiryDate = new Date(activeExam.expiresOn);
      const now = new Date();

      console.log('Timer setup - Current time:', now.toISOString());
      console.log('Timer setup - Expiry time:', expiryDate.toISOString());
      console.log('Timer setup - Time remaining (ms):', expiryDate.getTime() - now.getTime());

      // Validate that the date is in the future and reasonable
      if (expiryDate > now && (expiryDate.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000)) {
        console.log('Setting valid expiry timestamp');
        setExpiryTimestamp(expiryDate);
        // Reset the expired flag when setting a new valid timer
        hasExpiredRef.current = false;
      } else if (expiryDate <= now) {
        console.error('Expiry date is in the past:', expiryDate);
        // Set a default expiry time (10 minutes from now) as fallback
        const fallbackDate = new Date();
        fallbackDate.setMinutes(fallbackDate.getMinutes() + 10);
        setExpiryTimestamp(fallbackDate);
        hasExpiredRef.current = false;
      } else {
        console.error('Expiry date is too far in the future (>24h):', expiryDate);
        // Cap at 24 hours to prevent unreasonable timers
        const fallbackDate = new Date();
        fallbackDate.setHours(fallbackDate.getHours() + 24);
        setExpiryTimestamp(fallbackDate);
        hasExpiredRef.current = false;
      }
    }
  }, [activeExam]);

  // Custom onExpire handler to prevent multiple calls
  const handleExpire = () => {
    if (!hasExpiredRef.current) {
      console.log('Timer expired, triggering onTimerEnd');
      hasExpiredRef.current = true;
      onTimerEnd();
    } else {
      console.log('Timer already expired, ignoring duplicate expiration');
    }
  };

  const { hours, minutes, seconds } = useTimer({
    expiryTimestamp,
    onExpire: handleExpire,
    autoStart: true
  });

  // Format the time with leading zeros
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedHours = hours < 10 ? `0${hours}` : hours;

  return (
    <div className={classes.timerContainer}>
      <p className={classes.timer}>
        {hours > 0 ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}` : `${formattedMinutes}:${formattedSeconds}`}
      </p>
    </div>
  );
};

export default ExamTimer;
