'use client';

import { useEffect } from 'react';
import { initAmplitude } from '@/utils/amplititude';

export function AmplitudeInitializer() {
  useEffect(() => {
    initAmplitude();
  }, []);
  
  return null;
} 