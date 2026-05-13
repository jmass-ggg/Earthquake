let audioContext = null;
let alarmInterval = null;
let activeOscillator = null;
let activeGain = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function playBeep() {
  const context = getAudioContext();

  if (!context || context.state !== "running") {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(440, context.currentTime + 0.25);

  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.6, context.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.55);

  activeOscillator = oscillator;
  activeGain = gain;
}

export async function startEmergencyAlarm() {
  try {
    const context = getAudioContext();

    if (!context) {
      return {
        success: false,
        autoplayBlocked: false,
        error: "AudioContext is not supported"
      };
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    if (context.state !== "running") {
      return {
        success: false,
        autoplayBlocked: true
      };
    }

    if (alarmInterval) {
      return {
        success: true,
        autoplayBlocked: false
      };
    }

    playBeep();

    alarmInterval = setInterval(() => {
      playBeep();
    }, 900);

    return {
      success: true,
      autoplayBlocked: false
    };
  } catch (error) {
    console.error("Alarm start failed:", error);

    return {
      success: false,
      autoplayBlocked: true,
      error
    };
  }
}

export function stopEmergencyAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }

  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch {
      // oscillator may already be stopped
    }

    activeOscillator = null;
  }

  if (activeGain) {
    try {
      activeGain.disconnect();
    } catch {
      // gain may already be disconnected
    }

    activeGain = null;
  }
}