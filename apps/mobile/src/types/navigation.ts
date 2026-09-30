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
  FindPw: { mbUid: string; tempPwd?: string }; // tempPwd: 데모는 메일 대신 화면에 임시 비밀번호를 표시

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
  PinCharge: { chargeAmt: string };
  ChargeAcntWeb: { chargeAmt: string };
  ChargeSuc: { chargeAmt: string };
  // ------------------------------------- 충전하기 관련 화면들

  // 출금하기(환불) 관련 화면들 --------------------------------
  Refund: undefined;
  RefundAcnt: { amt: number };
  PinPayRefund: { acnt: IRefundAcnt; amt: number };
  /** acnt: 출금된 계좌. 완료 화면의 내역 카드에 은행·계좌번호를 보여주기 위해 함께 넘긴다 */
  RefundSuc: { data: IWithdrawalSuc; acnt?: IRefundAcnt };
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
  /** showAll: 대시보드 "전체보기" 진입 시 true. 기본 조건(1주일·결제) 대신 3개월·모두로 조회한다 */
  UseList: { showAll?: boolean } | undefined;
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
