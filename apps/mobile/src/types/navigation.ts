import type { IUserProfile } from '@typ/userType';
import type { IPaySuccess, IQRdata, IRefundAcnt, IWithdrawalSuc } from '@typ/paymentType';

/* 네비게이션 스택의 파라미터 리스트 정의 ==================== */
export type RootStackParamList = {
  // 최초 실행 시 권한 안내 화면 -------------------------------
  PermissionNotice: undefined;

  // 로그인 및 계정 찾기 화면들 --------------------------------
  Login: undefined;
  ChangeTempPwd: { uid: string; tempPwd: string };

  Find: undefined;
  FindAuthWeb: { uri: string };
  FindId: { mbUid: string; regDnt: string };
  FindPw: { mbUid: string };

  JoinOne: undefined;
  AuthWeb: { uri: string };
  JoinTwo: undefined;
  JoinThree: { memberAuthKey: string };
  JoinThreeChk: { number: string };
  JoinCompleted: undefined;
  // -------------------------------- 로그인 및 계정 찾기 화면들

  Dashboard: undefined;

  // 충전하기 관련 화면들 -------------------------------------
  ChargeSelectMethod: undefined;
  ChargeAmt: undefined;
  TransferAcntCharge: { amount: string };
  TransferAcntInput: { amount: string };
  PinCharge: { chargeAmt: string };
  ChargeAcntWeb: { chargeAmt: string };
  ChargeSuc: { chargeAmt: string };
  // ------------------------------------- 충전하기 관련 화면들

  // 출금하기(환불) 관련 화면들 --------------------------------
  Refund: undefined;
  RefundAcnt: { amt: number };
  PinPayRefund: { acnt: IRefundAcnt; amt: number };
  RefundSuc: { data: IWithdrawalSuc };
  // -------------------------------- 출금하기(환불) 관련 화면들

  // 계좌 등록 관련 화면들 ------------------------------------
  RefundAuth: { flg: 'first' | 'edit' };
  RefundAuthConfirm: {
    bankCd: string;
    acntNo: string;
    acntNm: string;
    nonce: string;
    flg: 'first' | 'edit';
  };
  // ------------------------------------ 계좌 등록 관련 화면들

  // 결제하기 관련 화면들 -------------------------------------
  QRscan: undefined;
  CodeInput: undefined;
  CodeInfo: { data: IQRdata };
  PinPayQR: { data: IQRdata };
  PayCompleted: { data: IPaySuccess };
  // ------------------------------------- 결제하기 관련 화면들

  // 이용내역 관련 화면들 -------------------------------------
  UseList: undefined;
  UseDetail: { item: any; getCd: string };
  // ------------------------------------- 이용내역 관련 화면들

  // 마이페이지 관련 화면들 ------------------------------------
  MyPage: undefined;

  UsrInfo: { usrData: IUserProfile | null };
  Withdrawal: undefined;
  WithdrawalAgr: { pwd: string };
  WithdrawalSuc: undefined;

  EditCheck: { usrData: IUserProfile | null; flg: 'usrInfo' | 'pinNo' };
  EditInfo: { usrData: IUserProfile; pwd: string };
  EditPinNo: { usrData: IUserProfile; pwd: string };
  EditPinNoChk: { newPin: string; pwd: string };

  AcntManage: undefined;

  TermList: undefined;
  TermContent: { flg: number; title: string };
  Service: undefined;
  Notice: undefined;
  FAQ: undefined;
  Inquiry: undefined;
  Setting: undefined;
  // ------------------------------------ 마이페이지 관련 화면들
};
