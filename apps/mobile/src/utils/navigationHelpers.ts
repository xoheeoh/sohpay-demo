import { StackActions } from '@react-navigation/native';

export const goBackToDashboard = (navigation: any) => {
  const routes = navigation.getState().routes;
  const dashboardIndex = routes.findIndex((r: { name: string }) => r.name === 'Dashboard');

  if (dashboardIndex >= 0) {
    const popCount = routes.length - 1 - dashboardIndex;
    if (popCount > 0) {
      navigation.dispatch(StackActions.pop(popCount));
    }
  } else {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  }
};

export const goToLogin = (navigation: any) => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
};
