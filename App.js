import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DinoGame from "./DinoGame";
import Game from "./Game";
import MiniGame from "./MiniGame";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Game"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Game" component={Game} />
          <Stack.Screen name="MiniGame" component={MiniGame} />
          <Stack.Screen name="DinoGame" component={DinoGame} />   
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

export default App;
