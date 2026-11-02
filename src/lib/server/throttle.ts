import { LoginThrottle } from './auth-core';

// One throttle for the whole app (single process).
export const loginThrottle = new LoginThrottle();
