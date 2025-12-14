// MiniGame.js (React Native)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function MiniGame({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ top: '50%', left: '50%' });
  const [gameActive, setGameActive] = useState(true);
  
  const targetTimerRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current; 

  const animateTarget = (toValue) => {
    Animated.timing(scaleAnim, {
      toValue: toValue,
      duration: 100, 
      useNativeDriver: true,
    }).start();
  };

  const startTargetTimer = () => {
    if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
    }

    setTargetVisible(true);
    
    const newPos = {
        top: `${Math.floor(Math.random() * 80) + 10}%`,
        left: `${Math.floor(Math.random() * 80) + 10}%`,
    };
    setTargetPosition(newPos);

    targetTimerRef.current = setTimeout(() => {
        setTargetVisible(false);
    }, 700); 
  };

  const hitTarget = () => {
    if (!targetVisible) return;
    
    animateTarget(1.2); 
    setTimeout(() => animateTarget(1), 100); 

    setScore(s => s + 1); 
    setTargetVisible(false); 
    
    if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
    }
    startTargetTimer();
  };

  useEffect(() => {
    if (!gameActive) return;

    const countdownTimer = setInterval(() => {
        setTimeLeft(t => {
            if (t <= 1) {
                clearInterval(countdownTimer);
                setGameActive(false);
                setTargetVisible(false);
                return 0;
            }
            return t - 1;
        });
    }, 1000); 

    const targetInterval = setInterval(() => {
        startTargetTimer();
    }, 1000); 

    return () => {
        clearInterval(countdownTimer);
        clearInterval(targetInterval);
        if (targetTimerRef.current) {
            clearTimeout(targetTimerRef.current);
        }
    };
  }, [gameActive]); 

  const handleReturn = async () => {
    try {
        if (score >= 5) {
            await AsyncStorage.setItem("game_result", "win"); 
        } else {
            await AsyncStorage.setItem("game_result", "lose"); 
        }
    } catch (e) {
        console.error("Failed to save game result", e);
    }
    navigation.navigate("Game");
  };
  
  return (
    <SafeAreaView style={RNStyles.safeArea}>
      <View style={RNStyles.minigameContainer}>
        <Text style={RNStyles.title}>🦴 Prinde Osul! 🦴</Text>
        
        <View style={RNStyles.statusBar}>
          <Text style={RNStyles.statusBarText}>
            Timp: **{timeLeft}s** | Scorul tău: **{score}**
          </Text>
        </View>

        {gameActive && (
          <View style={RNStyles.gameArea}>
            {targetVisible && (
              <TouchableOpacity 
                onPress={hitTarget}
                style={[
                  RNStyles.target,
                  { top: targetPosition.top, left: targetPosition.left }
                ]}
                activeOpacity={1}
              >
                <Animated.Text style={[RNStyles.targetText, { transform: [{ scale: scaleAnim }] }]}>
                  🦴
                </Animated.Text>
              </TouchableOpacity>
            )}
            <Text style={RNStyles.instruction}>Apasă pe Os înainte să dispară!</Text>
          </View>
        )}

        {!gameActive && (
          <View style={RNStyles.gameOver}>
            <Text style={RNStyles.gameOverTitle}>Joc Terminat!</Text>
            <Text style={RNStyles.gameOverText}>Ai prins **{score}** Osuri.</Text>
            <Text style={RNStyles.gameOverText}>
              {score >= 5 ? "Felicitări! Ai câștigat un bonus!" : "Ai nevoie de cel puțin 5 Osuri pentru bonus."}
            </Text>
            <TouchableOpacity onPress={handleReturn} style={RNStyles.returnButton}>
              <Text style={RNStyles.returnButtonText}>Întoarce-te la Animalul Tău</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// --- STILURI ---
const RNStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#d2b48c',
    },
    minigameContainer: {
        flex: 1,
        backgroundColor: '#d2b48c',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60, // mai mult spatiu pentru iPhone cu notch mare
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4a4a4a',
        marginTop: 20, // adauga inca putin spatiu vizual
        marginBottom: 20,
    },
    statusBar: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff8dc',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 20,
        width: '90%',
        alignItems: 'center',
    },
    statusBarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff8dc',
    },
    gameArea: {
        position: 'relative',
        width: '90%',
        height: 350,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderStyle: 'dashed',
        borderColor: '#a0522d',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
    },
    target: {
        position: 'absolute',
        zIndex: 10,
    },
    targetText: {
        fontSize: 40,
    },
    instruction: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        color: '#4a4a4a',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 200,
    },
    gameOver: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    gameOverTitle: {
        fontSize: 30,
        color: '#ffd700',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2,
        marginBottom: 15,
    },
    gameOverText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 5,
    },
    returnButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        fontSize: 18,
        marginTop: 20,
        borderRadius: 8,
        backgroundColor: '#a0522d',
    },
    returnButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
