import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IChargeList, IRefundList, IUseList } from '@typ/paymentType';
import { convertDateWithoutHypen, getDateWithHypen, getOneWeekAgoDate } from '@utils/formatter';
import { useDialog } from '@contexts/DialogContext';
import { loadTransactionList } from '@apis/paymentApi';
import { BottomSheet, Dropdown, PrimaryButton, ScreenWrapper, Typography } from '@components/common';
import {
  ChargeComponent,
  GetCdModal,
  PeriodModal,
  RefundComponent,
  TrxStCdModal,
  UseComponent,
} from '@components/uselist';
import { theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

type UseListScreenProps = NativeStackScreenProps<RootStackParamList, 'UseList'>;

const UseListScreen: React.FC<UseListScreenProps> = () => {
  /**
   * 기간 select 클릭하면 해당 BottomSheet 등장
   * 라디오 버튼 선택 값에 따라 조회 frDt, toDt 설정
   */
  const [frDt, setFrDt] = useState<string>(convertDateWithoutHypen(getOneWeekAgoDate()));
  const [toDt, setToDt] = useState<string>(convertDateWithoutHypen(getDateWithHypen(new Date())));

  const [periodModal, setPeriodModal] = useState<boolean>(false); // 기간 선택 BottomSheet

  const [selectedPeriod, setSelectedPeriod] = useState<string>('1week'); // 선택된 radio value값
  const [periodPlaceholder, setPeriodPlaceholder] = useState<string>('1주일');
  const [dropdownKey1, setDropdownKey1] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달로부터 값 전달받는 이벤트
  const handlePeriodChange = (frDt: string, toDt: string, radio: string) => {
    setFrDt(convertDateWithoutHypen(frDt));
    setToDt(convertDateWithoutHypen(toDt));
    setSelectedPeriod(radio);
  };

  // selectedPeriod가 변경되었을 때 placeholder 업데이트
  useEffect(() => {
    switch (selectedPeriod) {
      case '1week':
        setPeriodPlaceholder('1주일');
        break;
      case '1month':
        setPeriodPlaceholder('1개월');
        break;
      case '3months':
        setPeriodPlaceholder('3개월');
        break;
      case 'specific':
        setPeriodPlaceholder('직접입력');
        break;
      default:
        setPeriodPlaceholder('기간');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey1((prevKey) => prevKey + 1);
  }, [selectedPeriod]);

  /**
   * 거래 종류 select 클릭하면 해당 BottomSheet 등장
   * 라디오 버튼 선택 값에 따라 getCd 값 설정
   */
  const [tempGetCd, setTempGetCd] = useState<string>('USE'); // 거래종류 셀렉트 박스에서 선택된 값 (모달에 전달)
  const [actualGetCd, setActualGetCd] = useState<string>('USE'); // 실제 조회에 사용할 getCd (출금 선택 시 RFND로 변경됨)
  const [getCd, setGetCd] = useState<string>('USE'); // USE: 결제, CHRG: 충전, RFND: 출금 (실제 조회에 사용하는 거래종류 값)
  const [getCdModal, setGetCdModal] = useState<boolean>(false); // 거래종류 선택 BottomSheet

  const [selectedGetCd, setSelectedGetCd] = useState<string>('use'); // 선택된 radio value값
  const [getCdPlaceholder, setGetCdPlaceholder] = useState<string>('결제');
  const [dropdownKey2, setDropdownKey2] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달로부터 값 전달받는 이벤트
  const handleGetCdChange = (selectedGetCd: string, radio: string) => {
    setTempGetCd(selectedGetCd); // 모달에 전달할 값
    setActualGetCd(selectedGetCd); // 실제 조회에 사용할 값 초기화
    setSelectedGetCd(radio);

    // 거래 종류에 따른 거래 상태 첫 번째 값으로 초기화
    let firstTrxSt = { id: '', label: '거래상태', value: '' };

    if (selectedGetCd === 'USE') {
      firstTrxSt = { id: 'all', label: '모두', value: '9' };
    } else if (selectedGetCd === 'CHRG') {
      firstTrxSt = { id: 'charge', label: '충전', value: '9' };
    }

    setTrxStCd(firstTrxSt.value);
    setSelectedTrxStCd(firstTrxSt.id);
    setTrxStCdPlaceholder(firstTrxSt.label);
  };

  // selectedGetCd 변경되었을 때 placeholder 업데이트
  useEffect(() => {
    switch (selectedGetCd) {
      case 'use':
        setGetCdPlaceholder('결제');
        break;
      case 'charge':
        setGetCdPlaceholder('충전');
        break;
      default:
        setGetCdPlaceholder('거래종류');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey2((prevKey) => prevKey + 1);
  }, [selectedGetCd]);

  /**
   * 거래 상태 select 클릭하면 해당 BottomSheet 등장
   * 라디오 버튼 선택 값에 따라 getCd 값 설정
   */
  const [trxStCd, setTrxStCd] = useState<string>('9'); // USE - 0: 승인 | 1: 취소 | 9: 모두
  const [trxStCdModal, setTrxStCdModal] = useState<boolean>(false); // 거래상태 선택 BottomSheet

  const [selectedTrxStCd, setSelectedTrxStCd] = useState<string>('all'); // 선택된 radio value값
  const [trxStCdPlaceholder, setTrxStCdPlaceholder] = useState<string>('모두');
  const [dropdownKey3, setDropdownKey3] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달로부터 값 전달받는 이벤트
  const handleTrxStCdChange = (getCd: string, trxStCd: string, radio: string) => {
    setActualGetCd(getCd); // 실제 조회에 사용할 getCd 업데이트 (출금 선택 시 RFND로 변경)
    setTrxStCd(trxStCd);
    setSelectedTrxStCd(radio);
  };

  // selectedTrxStCd 변경되었을 때 placeholder 업데이트
  useEffect(() => {
    switch (selectedTrxStCd) {
      case 'confirm':
        setTrxStCdPlaceholder('승인');
        break;
      case 'cancel':
        setTrxStCdPlaceholder('취소');
        break;
      case 'charge':
        setTrxStCdPlaceholder('충전');
        break;
      case 'refund':
        setTrxStCdPlaceholder('출금');
        break;
      case 'all':
        setTrxStCdPlaceholder('모두');
        break;
      default:
        setTrxStCdPlaceholder('거래상태');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey3((prevKey) => prevKey + 1);
  }, [selectedTrxStCd]);

  // 각 select box의 width값 정의
  const selectWidth = (getAppWidth() - 64) / 3;

  /**
   * 조회 버튼을 클릭하면 이용내역 조회
   * 조회 데이터 및 페이지 상태관리
   * 스크롤이 리스트 맨 아래에 도달하면 다음 페이지 보이기 (무한 스크롤)
   */
  const [listData, setListData] = useState<any[]>([]); // 사용 내역

  const [startIdx, setStartIdx] = useState(0); // 항목 시작 번호
  const [maxCount] = useState(10); // 한 번에 가져올 최대 항목 수
  const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태
  const [hasMore, setHasMore] = useState<boolean>(false); // 더 가져올 데이터 존재 여부

  // 상태값 관리
  const [triggerFetch, setTriggerFetch] = useState(false); // 데이터 fetch 트리거 상태

  // 조회 버튼 클릭 이벤트
  const handleLoadList = async () => {
    if (!actualGetCd || !trxStCd || !frDt || !toDt) {
      alert({
        title: '안내',
        message1: '조회 조건이 선택되지 않았습니다.',
      });
      return;
    }

    // 선택된 값을 실제 조회 상태에 반영
    setGetCd(actualGetCd);

    // 데이터 초기화 및 조회 트리거
    setListData([]);
    setStartIdx(0);
    setHasMore(true);
    setTriggerFetch(true);
  };

  // 상태 업데이트 후 API 호출
  useEffect(() => {
    if (triggerFetch) {
      fetchData(true); // 데이터 리셋 후 fetch
      setTriggerFetch(false); // 트리거 초기화
    }
  }, [triggerFetch]);

  // 데이터를 가져오는 함수
  const fetchData = async (reset: boolean = false) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const currentStartIdx = reset ? 0 : startIdx;
      const data = await loadTransactionList(getCd, trxStCd, frDt, toDt, currentStartIdx, maxCount);

      if (data?.resultCd === '0000') {
        const newData = Array.isArray(data.listData) ? data.listData : [];

        console.log('조회 결과 리스트:', newData);

        setListData((prevData) => (reset ? newData : [...prevData, ...newData]));

        if (newData.length < maxCount) {
          setHasMore(false);
        } else {
          setStartIdx(currentStartIdx + maxCount);
        }
      } else {
        console.log('데이터 조회 실패:', data?.resultMsg || '알 수 없는 오류');
        setHasMore(false);
      }
    } catch (error) {
      console.log('API 호출 오류:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // FlatList 무한 스크롤
  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setTimeout(() => {
      fetchData();
    }, 300); // 디바운스: 300ms 후 실행
  };

  // 화면 진입 시, 1주일 결제 승인 내역을 기본값으로 보여주기
  useEffect(() => {
    handleLoadList();
  }, []);

  // Dialog
  const { alert } = useDialog();

  return (
    <ScreenWrapper backgroundColor="white">
      {/* 조회 옵션 설정 */}
      <View style={styles.wrap}>
        <View style={styles.selectBox}>
          {/* 기간 선택 */}
          <View style={{ width: selectWidth }}>
            <Dropdown
              key={`period-${dropdownKey1}`}
              size="small"
              onOpen="modal"
              placeholder={periodPlaceholder}
              options={[]}
              openEvent={() => setPeriodModal(true)}
            />
          </View>

          {/* 거래 종류 선택 */}
          <View style={{ width: selectWidth }}>
            <Dropdown
              key={`getCd-${dropdownKey2}`}
              size="small"
              onOpen="modal"
              placeholder={getCdPlaceholder}
              options={[]}
              openEvent={() => setGetCdModal(true)}
            />
          </View>

          {/* 거래 상태 선택 */}
          <View style={{ width: selectWidth }}>
            <Dropdown
              key={`trxStCd-${dropdownKey3}`}
              size="small"
              onOpen="modal"
              placeholder={trxStCdPlaceholder}
              options={[]}
              openEvent={() => setTrxStCdModal(true)}
            />
          </View>
        </View>

        <PrimaryButton label={'조회'} onPress={handleLoadList} size={'large'} />
      </View>

      {/* 조회 결과 리스트 */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={listData}
        keyExtractor={(item, index) => `${item.tid}-${index}`}
        renderItem={({ item }) => {
          if (getCd === 'USE') {
            const useItem = item as IUseList;
            return <UseComponent getCd={getCd} item={useItem} />;
          } else if (getCd === 'CHRG') {
            const chargeItem = item as IChargeList;
            return <ChargeComponent item={chargeItem} getCd={getCd} />;
          } else {
            const refundItem = item as IRefundList;
            return <RefundComponent item={refundItem} getCd={getCd} />;
          }
        }}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: theme.colors.gray100 }} />}
        ListFooterComponent={() =>
          isLoading ? <ActivityIndicator size={'small'} color={theme.colors.primary} /> : null
        }
        ListEmptyComponent={() =>
          isLoading ? null : (
            <View style={styles.empty}>
              <Typography mode="body2" color="gray500">
                데이터가 존재하지 않습니다.
              </Typography>
            </View>
          )
        }
        onEndReached={() => {
          // 빈 리스트에서도 onEndReached가 호출되며, setTimeout으로 예약된 fetch가
          // stale closure로 첫 페이지를 한 번 더 이어붙이는 경우가 있어 초기 조회 중에는 막음
          if (listData.length === 0) return;
          loadMore();
        }}
        onEndReachedThreshold={0.1}
      />

      {/* 기간 선택 모달 */}
      <BottomSheet
        visible={periodModal}
        setVisible={setPeriodModal}
        title={'조회하실 기간을 선택해 주세요'}
        content={
          <PeriodModal
            radioValue={selectedPeriod}
            frDt={frDt}
            toDt={toDt}
            handleSelectPeriod={() => setPeriodModal(false)}
            onPeriodChange={handlePeriodChange}
          />
        }
      />

      {/* 거래종류 선택 모달 */}
      <BottomSheet
        visible={getCdModal}
        setVisible={setGetCdModal}
        title={'조회하실 거래 종류를 선택해 주세요'}
        content={
          <GetCdModal
            radioValue={selectedGetCd}
            handleSelectedGetCd={() => setGetCdModal(false)}
            onGetCdChange={handleGetCdChange}
          />
        }
      />

      {/* 거래상태 선택 모달 */}
      <BottomSheet
        visible={trxStCdModal}
        setVisible={setTrxStCdModal}
        title={'조회하실 거래 상태를 선택해 주세요'}
        content={
          <TrxStCdModal
            radioValue={selectedTrxStCd}
            getCd={tempGetCd}
            handleSelectedTrxStCd={() => setTrxStCdModal(false)}
            onTrxStCdChange={handleTrxStCdChange}
          />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, gap: 16 },
  selectBox: { flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'flex-start' },
  empty: { alignItems: 'center', paddingVertical: 48 },
});

export default UseListScreen;
export { UseListScreen };
