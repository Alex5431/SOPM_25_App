import { StyleSheet, View } from 'react-native';
import App from '../src/App';

export default function Index() {
  return (
    <View style={styles.container}>
      <App />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
