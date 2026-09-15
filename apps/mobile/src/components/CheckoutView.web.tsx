import { StyleSheet, View } from 'react-native';

type Props = { url: string; onDeepLink: (url: string) => void };

/** 웹: iframe. 딥링크는 못 받으므로 부모 화면의 상태 폴링에 의존한다. */
export function CheckoutView({ url }: Props) {
  return (
    <View style={styles.wrap}>
      {/* react-native-web 에서는 DOM 요소를 직접 렌더링할 수 있다 */}
      <iframe src={url} title="checkout" style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1 } });
