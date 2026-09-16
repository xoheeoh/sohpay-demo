/* 공지사항 리스트 */
export interface INoticeList {
  body: string;
  frDt: string;
  notiCd: string;
  notiCdNm: string;
  regDt: string;
  seq: number;
  title: string;
  toDt: string;
}

/* FAQ 리스트 */
export interface IFAQList {
  body: string;
  ctgr: string;
  ctgrNm: string;
  regDt: string;
  seq: number;
  title: string;
}

/* 1:1 상담 리스트 */
export interface IMyInquiryList {
  ctgr: string;
  seq: number;
  qnaStType: string;
  qnaStTypeNm: string;
  regDt: string;
  head: string;
  body: string;
  answerList?: IAnswerList;
}

/* 1:1 상담 응답 리스트 */
interface IAnswerList {
  seq: number;
  qnaStType: string;
  qnaStTypeNm: string;
  regDt: string;
  head: string;
  body: string;
}
