/* 회원 프로필 정보 */
export interface IUserProfile {
  mbUid: string;
  email: string;
  joinDnt: string;
  usrNm: string;
  hpNo: string;
  brthDt: string;
  pointUseFlg: '0' | '1'; // 0: 미사용, 1: 사용
}

/* 회원가입 정보 */
export interface IUserData {
  usrNm: string;
  email: string;
  pwd: string;
  mbUid: string;
  usrPin: string;
  optionAgree: boolean;
  memberAuthKey: string;
  nonce: string;
}
