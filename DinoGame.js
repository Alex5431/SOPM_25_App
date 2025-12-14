import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import dogHappy from "./images/dog_happy.png";

const { width } = Dimensions.get("window");

export default function DinoDogGame({ navigation }) {
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasReachedGoal, setHasReachedGoal] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [gameReady, setGameReady] = useState(false); // pentru delay inițial

  const obstaclePositionX = useRef(new Animated.Value(width)).current;
  const jumpAnimY = useRef(new Animated.Value(0)).current;

  const curObstacleX = useRef(width);
  const curJumpY = useRef(0);

  // --- încărcare record ---
  useEffect(() => {
    const loadBestScore = async () => {
      const savedScore = await AsyncStorage.getItem("dino_best_score");
      if (savedScore) setBestScore(parseInt(savedScore, 10));
    };
    loadBestScore();
  }, []);

  // --- ascultare poziții ---
  useEffect(() => {
    const idX = obstaclePositionX.addListener(({ value }) => {
      curObstacleX.current = value;
    });
    const idY = jumpAnimY.addListener(({ value }) => {
      curJumpY.current = value;
    });
    return () => {
      obstaclePositionX.removeListener(idX);
      jumpAnimY.removeListener(idY);
    };
  }, []);

  // --- animația săriturii ---
  useEffect(() => {
    if (isJumping) {
      Animated.sequence([
        Animated.timing(jumpAnimY, {
          toValue: -160,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(jumpAnimY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start(() => setIsJumping(false));
    }
  }, [isJumping]);

  // --- viteză obstacol ---
  const getSpeedDuration = () => {
    if (score >= 20) return 1000;
    if (score >= 10) return 1300;
    if (score >= 5) return 1600;
    return 2000;
  };

  // --- mișcarea obstacolului ---
  const startObstacleAnimation = () => {
    obstaclePositionX.setValue(width);

    Animated.timing(obstaclePositionX, {
      toValue: -50,
      duration: getSpeedDuration(),
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !gameOver) {
        setScore((s) => {
          const newScore = s + 1;
          if (newScore >= 15) setHasReachedGoal(true);
          return newScore;
        });
        startObstacleAnimation();
      }
    });
  };

  // --- întârziere inițială (pornește automat după 1.5s) ---
  useEffect(() => {
    if (!gameOver) {
      const delay = setTimeout(() => {
        setGameReady(true);
        startObstacleAnimation();
      }, 1500); // 1.5 secunde delay la start

      return () => clearTimeout(delay);
    } else {
      obstaclePositionX.stopAnimation();
    }
  }, [gameOver]);

  // --- control săritură ---
  const handleJump = () => {
    if (!isJumping && !gameOver && gameReady) {
      setIsJumping(true);
    }
  };

  // --- resetare joc ---
  const resetGame = () => {
    obstaclePositionX.stopAnimation();
    obstaclePositionX.setValue(width);
    jumpAnimY.setValue(0);
    setIsJumping(false);
    setScore(0);
    setHasReachedGoal(false);
    setGameOver(false);
    setGameReady(false);
  };

  // --- detecție coliziune ---
  useEffect(() => {
    if (gameOver) return;

    const checkCollision = setInterval(() => {
      const obsX = curObstacleX.current;
      const jumpY = curJumpY.current;

      const dogHitboxOffset = 25;
      const dogHitboxWidth = 40;
      const dogLeft = 60 + dogHitboxOffset;
      const dogRight = dogLeft + dogHitboxWidth;

      const obsHitboxPadding = 5;
      const obsLeft = obsX + obsHitboxPadding;
      const obsRight = obsX + 40 - obsHitboxPadding;

      const collisionX = obsLeft < dogRight && obsRight > dogLeft;

      const deadlyHeight = 50;
      const collisionY = jumpY > -deadlyHeight;

      if (collisionX && collisionY) {
        clearInterval(checkCollision);
        handleGameOver();
      }
    }, 16);

    return () => clearInterval(checkCollision);
  }, [gameOver]);

  // --- game over ---
  const handleGameOver = () => {
    setGameOver(true);
    AsyncStorage.getItem("dino_best_score").then((savedScore) => {
      const currentBest = savedScore ? parseInt(savedScore, 10) : 0;
      if (score > currentBest) {
        setBestScore(score);
        AsyncStorage.setItem("dino_best_score", score.toString());
      }
    });
    const result = hasReachedGoal ? "win" : "lose";
    AsyncStorage.setItem("game_result", result);
  };

  const handleBackToPet = () => {
    navigation.navigate("Game");
  };

  return (
    <TouchableOpacity
      onPress={handleJump}
      activeOpacity={1}
      style={RNStyles.dogGameBg}
    >
      <View style={RNStyles.floor} />

      <Animated.Image
        source={dogHappy}
        style={[RNStyles.dog, { transform: [{ translateY: jumpAnimY }] }]}
      />

      <Animated.View
        style={[
          RNStyles.obstacle,
          { transform: [{ translateX: obstaclePositionX }] },
        ]}
      />

      <View style={RNStyles.scoreContainer}>
        <View style={RNStyles.scoreBox}>
          <Text style={RNStyles.scoreText}>Scor: {score}</Text>
        </View>
        <View style={RNStyles.bestScoreBox}>
          <Text style={RNStyles.scoreText}>Record: {bestScore}</Text>
        </View>
      </View>

      {!gameReady && !gameOver && (
        <View style={RNStyles.readyOverlay}>
          <Text style={RNStyles.readyText}>Pregătește-te!</Text>
        </View>
      )}

      {hasReachedGoal && !gameOver && (
        <View style={RNStyles.goalReached}>
          <Text style={RNStyles.goalReachedText}>Bonus Activat!</Text>
        </View>
      )}

      {gameOver && (
        <View style={RNStyles.gameOverOverlay}>
          <Text style={RNStyles.gameOverTitle}>
            {hasReachedGoal
              ? "Ai Câștigat Bonusul! 🎉"
              : "Ai lovit obstacolul! 😢"}
          </Text>

          {score >= bestScore && score > 0 ? (
            <Text style={RNStyles.newRecord}>🎉 NOU RECORD: {score}! 🎉</Text>
          ) : (
            <Text style={RNStyles.currentRecord}>Scor final: {score}</Text>
          )}

          <TouchableOpacity style={RNStyles.retryButton} onPress={resetGame}>
            <Text style={RNStyles.retryButtonText}>Joacă din nou</Text>
          </TouchableOpacity>

          <TouchableOpacity style={RNStyles.backButton} onPress={handleBackToPet}>
            <Text style={RNStyles.backButtonText}>Înapoi la Animal</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// --- STILURI ---
const RNStyles = StyleSheet.create({
  dogGameBg: {
    flex: 1,
    backgroundColor: "#d3a874",
    position: "relative",
    overflow: "hidden",
  },
  floor: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 20,
    backgroundColor: "#8b4513",
    zIndex: 5,
  },
  dog: {
    width: 90,
    height: 90,
    position: "absolute",
    bottom: 15,
    left: 60,
    zIndex: 20,
    elevation: 20,
  },
  obstacle: {
    width: 40,
    height: 70,
    backgroundColor: "#4b2e0f",
    position: "absolute",
    bottom: 15,
    zIndex: 10,
    elevation: 10,
  },
  scoreContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "column",
    gap: 5,
    zIndex: 50,
    elevation: 50,
  },
  scoreBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  bestScoreBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  readyOverlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  readyText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 100,
    elevation: 100,
  },
  gameOverTitle: {
    fontSize: 30,
    marginBottom: 20,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  newRecord: {
    color: "#ffd700",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 15,
    textAlign: "center",
  },
  currentRecord: {
    fontSize: 18,
    marginVertical: 15,
    color: "white",
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    margin: 10,
    borderRadius: 30,
    backgroundColor: "#ffd700",
    elevation: 5,
  },
  retryButtonText: {
    color: "#4b2e0f",
    fontWeight: "bold",
    fontSize: 20,
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    margin: 10,
    borderRadius: 30,
    backgroundColor: "#a0522d",
    elevation: 5,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  goalReached: {
    position: "absolute",
    top: 150,
    alignSelf: "center",
    backgroundColor: "#32cd32",
    padding: 10,
    borderRadius: 20,
    zIndex: 60,
    elevation: 60,
  },
  goalReachedText: {
    color: "white",
    fontWeight: "bold",
  },
});
