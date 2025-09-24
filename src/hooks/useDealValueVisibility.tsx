import { useState, useEffect } from 'react';

const DEAL_VALUE_VISIBILITY_KEY = 'dealValueVisibility';

export function useDealValueVisibility() {
  const [showDealValue, setShowDealValue] = useState<boolean>(() => {
    // Initialize from localStorage or default to true
    const stored = localStorage.getItem(DEAL_VALUE_VISIBILITY_KEY);
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    // Persist to localStorage whenever the value changes
    localStorage.setItem(DEAL_VALUE_VISIBILITY_KEY, JSON.stringify(showDealValue));
  }, [showDealValue]);

  return { showDealValue, setShowDealValue };
}