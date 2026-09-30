/** 앱 딥링크 scheme (AndroidManifest와 동일) */
export const APP_URL_SCHEME = 'sohpay';

/** 앱 내부용 딥링크 (뱅크페이 복귀 URL과 구분) */
export const APP_RETURN_URL = `${APP_URL_SCHEME}://charge/return`;

/** 앱 내부에서 생성한 딥링크인지 확인 */
export const isInternalAppReturnUrl = (url: string) =>
  url === APP_RETURN_URL || url === `${APP_URL_SCHEME}://charge/return`;

const CALLBACK_PARAM_PATTERN = /(?:^|[?&#])(RESULT_CODE|resultCd|RESULT_MSG|resultMsg)=/i;

/** 뱅크페이/PG 결제 완료 콜백 URL인지 확인 */
export const isPaymentCallbackUrl = (url: string) => {
  if (!url) {
    return false;
  }

  return CALLBACK_PARAM_PATTERN.test(url);
};

const parseQueryString = (query: string) => {
  const params: Record<string, string> = {};

  query.split('&').forEach((pair) => {
    if (!pair) {
      return;
    }

    const [key, ...rest] = pair.split('=');
    if (!key) {
      return;
    }

    params[key] = decodeURIComponent(rest.join('=').replace(/\+/g, ' '));
  });

  return params;
};

type PaymentWebViewResult = {
  resultCd?: string;
  resultMsg?: string;
};

/** WebView postMessage 결제 결과 객체 추출 (PG 배열/객체 형식 모두 지원) */
export const parseWebViewPaymentMessage = (parsedData: unknown): PaymentWebViewResult | null => {
  if (Array.isArray(parsedData)) {
    const payload = parsedData[1];
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return payload as PaymentWebViewResult;
    }
    return null;
  }

  if (parsedData && typeof parsedData === 'object' && 'resultCd' in parsedData) {
    return parsedData as PaymentWebViewResult;
  }

  return null;
};

/** WebView postMessage 결제 성공 여부 */
export const isWebViewPaymentSuccess = (parsedData: unknown) => {
  const result = parseWebViewPaymentMessage(parsedData);
  return result?.resultCd === '0000';
};

/** URL에서 결제 결과 파라미터 추출 */
export const parsePaymentCallbackParams = (url: string) => {
  const query = url.includes('?') ? (url.split('?')[1]?.split('#')[0] ?? '') : url;
  return parseQueryString(query);
};

/** 결제 성공 여부 (뱅크페이: RESULT_CODE=00, PG: resultCd=0000) */
export const isPaymentSuccessUrl = (url: string) => {
  const params = parsePaymentCallbackParams(url);

  if (params.RESULT_CODE !== undefined) {
    return params.RESULT_CODE === '00';
  }

  if (params.resultCd !== undefined) {
    return params.resultCd === '0000';
  }

  return false;
};

export const getPaymentResultMessage = (url: string) => {
  const params = parsePaymentCallbackParams(url);
  return params.RESULT_MSG ?? params.resultMsg ?? '충전에 실패했습니다.';
};

/** 앱 자체 딥링크 URL인지 확인 */
export const isAppCallbackUrl = (url: string) => {
  const scheme = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)?.[1]?.toLowerCase();
  return scheme === APP_URL_SCHEME;
};

/**
 * 뱅크페이 앱 복귀 URL에서 WebView로 로드할 PG URL 추출
 * 예) sohpay://?callbackparam1=https://pg.com/return&RESULT_CODE=00
 */
export const parseBankPayReturnUrl = (url: string) => {
  if (!isAppCallbackUrl(url)) {
    return null;
  }

  const params = parsePaymentCallbackParams(url);
  const callbackUrl = params.callbackparam1;
  if (!callbackUrl) {
    return null;
  }

  const decodedCallbackUrl = decodeURIComponent(callbackUrl);
  const otherParams = Object.entries(params)
    .filter(([key]) => key !== 'callbackparam1')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  if (!otherParams) {
    return decodedCallbackUrl;
  }

  const separator = decodedCallbackUrl.includes('?') ? '&' : '?';
  return `${decodedCallbackUrl}${separator}${otherParams}`;
};
