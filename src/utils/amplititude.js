// amplitude.js
import * as amplitude from '@amplitude/analytics-browser';

export const initAmplitude = () => {
    if (typeof window !== 'undefined') {
        amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY);
    }
};

export const logEvent = (eventName, eventProperties) => {
    if (typeof window !== 'undefined') {
        amplitude.track(eventName, eventProperties);
    }
};
