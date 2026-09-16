import { BankErrorCode } from './enum';

type BankErrorMessage = {
  msg1: string;
  msg2?: string; // 두 번째 줄은 옵션
};

export const BankErrorMessages: Record<BankErrorCode, BankErrorMessage> = {
  [BankErrorCode.DATA_PROCESSING_ERROR]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.NOT_AFFILIATE]: {
    msg1: '기타 오류가 발생하였습니다.',
    msg2: '고객센터를 통해 문의해주세요.',
  },
  [BankErrorCode.ENCRYPTION_ERROR]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.INVALID_INPUT]: {
    msg1: '1원 송금에 실패하였습니다.',
    msg2: '입력하신 계좌 정보를 다시 한번 확인해주세요.',
  },
  [BankErrorCode.INVALID_IP]: {
    msg1: '기타 오류가 발생하였습니다.',
    msg2: '고객센터를 통해 문의해주세요.',
  },
  [BankErrorCode.ETC_ERROR]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.EXPIRED_VERIFICATION]: {
    msg1: '인증 유효시간이 만료 되었습니다.',
    msg2: '인증 절차를 다시 진행해주세요.',
  },
  [BankErrorCode.TRANSACTION_MISMATCH]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.WRONG_ACCOUNT_NAME]: {
    msg1: '1원 송금에 실패하였습니다.',
    msg2: '본인 명의의 계좌에 대한 인증만 가능합니다.',
  },
  [BankErrorCode.INVALID_VERIFICATION_NUMBER]: {
    msg1: '소페이에서 입금한 1원 내역의 입금자명',
    msg2: '숫자 3자리를 확인 후 다시 입력해주세요.',
  },
  [BankErrorCode.SIMPLE_ACCOUNT_NOT_ALLOWED]: {
    msg1: '인증을 위한 거래가 불가능한 계좌입니다.',
    msg2: '다른 계좌로 다시 시도하여 주세요.',
  },
  [BankErrorCode.NO_TRANSACTION_INFO]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.TRANSACTION_FAILED]: {
    msg1: '인증 처리 중 오류가 발생하였습니다.',
    msg2: '잠시 후 다시 시도하여 주세요.',
  },
  [BankErrorCode.BANK_ERROR]: {
    msg1: '은행 오류',
  },
  [BankErrorCode.AUTH_ERROR]: {
    msg1: '소페이에서 입금한 1원 내역의 입금자명',
    msg2: '숫자 3자리를 확인 후 다시 입력해주세요.',
  },
};

// 에러메시지 매핑
export const getBankErrorMessage = (code: string) => {
  return (
    BankErrorMessages[code as BankErrorCode] ?? {
      msg1: '알 수 없는 오류가 발생했습니다.',
      msg2: '잠시 후 다시 시도해주세요.',
    }
  );
};
