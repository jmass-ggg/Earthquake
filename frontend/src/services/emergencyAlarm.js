let alarmAudio = null;
let vibrationTimer = null;
let alarmRunning = false;

const VIBRATION_PATTERN = [500, 200, 500, 300, 900];

function createAlarmAudio() {
  const audio = new Audio("/alarm.mp3");
  audio.loop = true;
  audio.volume = 1;
  return audio;
}

export function startVibration() {
  if (!("vibrate" in navigator)) {
    return;
  }

  navigator.vibrate(VIBRATION_PATTERN);

  if (vibrationTimer) {
    clearInterval(vibrationTimer);
  }

  vibrationTimer = setInterval(() => {
    navigator.vibrate(VIBRATION_PATTERN);
  }, 2500);
}

export function stopVibration() {
  if (vibrationTimer) {
    clearInterval(vibrationTimer);
    vibrationTimer = null;
  }

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

export async function startEmergencyAlarm() {
  startVibration();

  if (!alarmAudio) {
    alarmAudio = createAlarmAudio();
  }

  try {
    await alarmAudio.play();
    alarmRunning = true;

    return {
      success: true,
      autoplayBlocked: false
    };
  } catch (error) {
    alarmRunning = true;

    return {
      success: false,
      autoplayBlocked: true,
      error
    };
  }
}

export function stopEmergencyAlarm() {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }

  stopVibration();
  alarmRunning = false;
}

export function isAlarmRunning() {
  return alarmRunning;
}