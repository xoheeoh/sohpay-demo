import { callFunction } from './functions';

export type IdentityStart = { verificationId: string; checkoutUrl: string };
export type IdentityResult = { verificationId: string; name: string; birthDate: string; phone: string; memberAuthKey: string };

export const startIdentity = (method: 'MOBILE' | 'SIMPLE' | 'IPIN' = 'MOBILE') =>
  callFunction<IdentityStart>('identity/start', { method }, false);

export const getIdentityResult = (verificationId: string) =>
  callFunction<IdentityResult>('identity/result', { verificationId }, false);
