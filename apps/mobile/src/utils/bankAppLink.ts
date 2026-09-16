import { Linking, NativeModules, Platform } from 'react-native';

import { isPaymentCallbackUrl } from './paymentCallback';

type BankAppInfo = {
  name: string;
  iosStoreUrl: string;
  androidPackage: string;
};

type PaymentIntentModule = {
  openIntentUrl: (url: string) => Promise<boolean>;
};

const PaymentIntent = NativeModules.PaymentIntent as PaymentIntentModule | undefined;

const BANK_APPS: Record<string, BankAppInfo> = {
  kbbank: {
    name: 'KB스타뱅킹',
    iosStoreUrl: 'https://apps.apple.com/kr/app/id373742138',
    androidPackage: 'com.kbstar.kbbank',
  },
  'kftc-bankpay': {
    name: '뱅크페이',
    iosStoreUrl: 'https://apps.apple.com/kr/app/id398456030',
    androidPackage: 'com.kftc.bankpay.android',
  },
  'kn-bankpay': {
    name: 'BNK경남은행',
    iosStoreUrl: 'https://apps.apple.com/kr/app/id678852685',
    androidPackage: 'com.knb.psb',
  },
};

type ConfirmFn = (args: {
  title?: string;
  message1: string;
  message2?: string;
  confirmText?: string;
  cancelText?: string;
}) => Promise<boolean>;

type ParsedIntentUrl = {
  scheme: string | null;
  packageName: string | null;
  appUrl: string | null;
};

export const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const WEBVIEW_INTERNAL_SCHEMES = new Set(['about', 'javascript', 'data', 'blob', 'file', 'content']);

const extractScheme = (url: string) => url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)?.[1]?.toLowerCase() ?? null;

const isAndroidIntentUrl = (url: string) => Platform.OS === 'android' && url.startsWith('intent://');

const parseAndroidIntentUrl = (url: string): ParsedIntentUrl | null => {
  if (!isAndroidIntentUrl(url)) {
    return null;
  }

  const intentSuffix = url.split('#Intent;')[1];
  if (!intentSuffix) {
    return null;
  }

  const scheme = intentSuffix.match(/(?:^|;)scheme=([^;]+)/i)?.[1]?.toLowerCase() ?? null;
  const packageName = intentSuffix.match(/(?:^|;)package=([^;]+)/i)?.[1] ?? null;
  const path = url.replace(/^intent:\/\//, '').split('#Intent')[0];
  const appUrl = scheme ? `${scheme}://${path}` : null;

  return { scheme, packageName, appUrl };
};

const findBankApp = (scheme: string | null, packageName: string | null) => {
  if (scheme && BANK_APPS[scheme]) {
    return BANK_APPS[scheme];
  }

  if (packageName) {
    return Object.values(BANK_APPS).find((app) => app.androidPackage === packageName);
  }

  return undefined;
};

/** 은행 앱 실행용 커스텀 scheme URL인지 확인 (WebView 내부 URL 제외) */
export const isBankAppUrl = (url: string) => {
  if (isHttpUrl(url) || isAndroidIntentUrl(url) || isPaymentCallbackUrl(url)) {
    return false;
  }

  const scheme = extractScheme(url);
  if (!scheme || WEBVIEW_INTERNAL_SCHEMES.has(scheme)) {
    return false;
  }

  return scheme in BANK_APPS;
};

/** WebView에서 가로채야 하는 결제 앱 URL인지 확인 */
export const shouldInterceptPaymentUrl = (url: string) => isAndroidIntentUrl(url) || isBankAppUrl(url);

const getStoreUrl = (bankApp: BankAppInfo) =>
  Platform.OS === 'ios'
    ? bankApp.iosStoreUrl
    : `https://play.google.com/store/apps/details?id=${bankApp.androidPackage}`;

const promptInstall = async (bankApp: BankAppInfo, confirm: ConfirmFn) => {
  const storeName = Platform.OS === 'ios' ? '앱 스토어' : 'Play 스토어';

  const ok = await confirm({
    title: `${bankApp.name} 앱 필요`,
    message1: '결제를 진행하려면 해당 은행 앱이 필요합니다.',
    message2: `${storeName}로 이동하시겠습니까?`,
    confirmText: '이동',
    cancelText: '취소',
  });

  if (ok) {
    await Linking.openURL(getStoreUrl(bankApp));
  }
};

const openAndroidIntentUrl = async (url: string, confirm: ConfirmFn) => {
  const parsed = parseAndroidIntentUrl(url);
  const bankApp = findBankApp(parsed?.scheme ?? null, parsed?.packageName ?? null);

  if (PaymentIntent?.openIntentUrl) {
    const opened = await PaymentIntent.openIntentUrl(url);
    if (opened) {
      return;
    }
  } else if (parsed?.appUrl) {
    try {
      const canOpen = await Linking.canOpenURL(parsed.appUrl);
      if (canOpen) {
        await Linking.openURL(parsed.appUrl);
        return;
      }
    } catch (error) {
      console.error('Error opening intent URL:', error);
    }
  }

  if (bankApp) {
    await promptInstall(bankApp, confirm);
  }
};

const openBankAppUrl = async (url: string, confirm: ConfirmFn) => {
  const scheme = extractScheme(url);
  const bankApp = scheme ? BANK_APPS[scheme] : undefined;

  if (!bankApp) {
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    await promptInstall(bankApp, confirm);
  } catch (error) {
    console.error('Error opening URL:', error);
    await promptInstall(bankApp, confirm);
  }
};

/** WebView에서 은행 앱 URL을 열 때, 미설치 시 스토어로 안내 */
export const openExternalAppUrl = async (url: string, confirm: ConfirmFn) => {
  if (isAndroidIntentUrl(url)) {
    await openAndroidIntentUrl(url, confirm);
    return;
  }

  if (!isBankAppUrl(url)) {
    return;
  }

  await openBankAppUrl(url, confirm);
};
