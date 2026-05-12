import { useEffect, useState } from "react";

function getStoredValue(key, initialValue) {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null) {
      return initialValue;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(`Could not read localStorage key: ${key}`, error);
    return initialValue;
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return getStoredValue(key, initialValue);
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save localStorage key: ${key}`, error);
    }
  }, [key, value]);

  return [value, setValue];
}