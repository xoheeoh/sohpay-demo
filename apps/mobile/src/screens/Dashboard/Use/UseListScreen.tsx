import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { TransactionListItem } from '@typ/paymentType';
import { convertDateWithoutHypen, getDateMonthsAgo, getDateWithHypen, getOneWeekAgoDate } from '@utils/formatter';
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

const UseListScreen: React.FC<UseListScreenProps> = ({ route }) => {
  /**
   * 처음 열릴 때의 조회 조건
   * - 기본: 1주일 · 결제
   * - 대시보드 "전체보기"로 들어오면(showAll): 3개월 · 모두. 대시보드 최근 목록은 기간 제한이 없어서, 같은 건들이 여기서도 보이게 넉넉히 연다
   */
  const showAll = route.params?.showAll ?? false;
  const initialPeriod = showAll ? '3months' : '1week';
  const initialFrDt = showAll ? getDateMonthsAgo(3) : getOneWeekAgoDate();
  const initialGetCd = showAll ? 'ALL' : 'USE';
  const initialGetCdRadio = showAll ? 'all' : 'use';

  /**
   * 기간 select 클릭하면 해당 BottomSheet 등장
   * 라디오 버튼 선택 값에 따라 조회 frDt, toDt 설정
   */
  const [frDt, setFrDt] = useState<string>(convertDateWithoutHypen(initialFrDt));
  const [toDt, setToDt] = useState<string>(convertDateWithoutHypen(getDateWithHypen(new Date())));

  const [periodModal, setPeriodModal] = useState<boolean>(false); // 기간 선택 BottomSheet

  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod); // 선택된 radio value값
  const [periodPlaceholder, setPeriodPlaceholder] = useState<string>(showAll ? '3개월' : '1주일');
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
  const [tempGetCd, setTempGetCd] = useState<string>(initialGetCd); // 거래종류 셀렉트 박스에서 선택된 값 ALL | USE | CHRG (거래상태 모달에 전달)
  const [actualGetCd, setActualGetCd] = useState<string>(initialGetCd); // 실제 조회에 사용할 getCd (충전 종류에서 거래 상태를 고르면 CHRG_RFND | CHRG | RFND 로 바뀜)
  const [getCd, setGetCd] = useState<string>(initialGetCd); // 조회 버튼을 누른 시점의 getCd: ALL 모두 | USE 결제 | CHRG 충전 | RFND 출금 | CHRG_RFND 충전+출금
  const [getCdModal, setGetCdModal] = useState<boolean>(false); // 거래종류 선택 BottomSheet

  const [selectedGetCd, setSelectedGetCd] = useState<string>(initialGetCdRadio); // 선택된 radio value값
  const [getCdPlaceholder, setGetCdPlaceholder] = useState<string>(showAll ? '모두' : '결제');
  const [dropdownKey2, setDropdownKey2] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달로부터 값 전달받는 이벤트
  const handleGetCdChange = (selectedGetCd: string, radio: string) => {
    setTempGetCd(selectedGetCd); // 모달에 전달할 값
    setSelectedGetCd(radio);

    // 거래 종류가 바뀌면 거래 상태는 "모두"로 되돌린다.
    // 충전 종류의 "모두"는 충전+출금이라 실제 조회 getCd 가 CHRG_RFND 가 된다.
    setActualGetCd(selectedGetCd === 'CHRG' ? 'CHRG_RFND' : selectedGetCd);
    setTrxStCd('9');
    setSelectedTrxStCd('all');
    setTrxStCdPlaceholder('모두');
  };

  // selectedGetCd 변경되었을 때 placeholder 업데이트
  useEffect(() => {
    switch (selectedGetCd) {
      case 'all':
        setGetCdPlaceholder('모두');
        break;
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
  const [listData, setListData] = useState<TransactionListItem[]>([]); // 사용 내역 (모두 조회 시 종류가 섞여 있음)

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

  // 화면 진입 시, 위에서 정한 초기 조건(기본 1주일·결제 / 대시보드 전체보기는 3개월·모두)으로 바로 조회
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
              size="md"
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
              size="md"
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
              size="md"
              onOpen="modal"
              placeholder={trxStCdPlaceholder}
              options={[]}
              openEvent={() => setTrxStCdModal(true)}
            />
          </View>
        </View>

        <PrimaryButton label={'조회'} onPress={handleLoadList} size={'lg'} />
      </View>

      {/* 조회 결과 리스트 */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={listData}
        keyExtractor={(item, index) => `${item.getCd}-${'tid' in item ? item.tid : item.rfndNo}-${index}`}
        renderItem={({ item }) => {
          // 화면 전체 조회 조건이 아니라 각 건의 종류(item.getCd)로 행 모양을 정한다 ("모두" 조회 시 섞여 있음)
          if (item.getCd === 'USE') {
            return <UseComponent getCd={item.getCd} item={item} />;
          } else if (item.getCd === 'CHRG') {
            return <ChargeComponent item={item} getCd={item.getCd} />;
          } else {
            return <RefundComponent item={item} getCd={item.getCd} />;
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
