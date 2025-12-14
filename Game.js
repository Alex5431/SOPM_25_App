// Game.js (React Native)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 1. Importăm Audio din Expo
import { Audio } from 'expo-av';

// --- IMPORTURI IMAGINI ---
import dogDirty from "./images/dog_dirty.png";
import dogHappy from "./images/dog_happy.png";
import dogHungry from "./images/dog_hungry.png";
import dogSad from "./images/dog_sad.png";

import { default as eatSoundFile, default as happySoundFile } from "./sounds/happy_win.mp3";
import washSoundFile from "./sounds/wash_complete.mp3";


const usePersistentState = (key, defaultValue) => {
  const [state, setState] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setState(JSON.parse(saved));
        }
      } catch (e) { console.error("Failed to load state", e); } 
      finally { setIsLoaded(true); }
    };
    loadState();
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(key, JSON.stringify(state)).catch((e) =>
        console.error("Failed to save state", e)
      );
    }
  }, [key, state, isLoaded]);

  return [state, setState];
};

// --- COMPONENTĂ PROGRES ---
const ProgressBar = ({ value, max, label, color = "#9370db" }) => (
  <View style={RNStyles.statBarContainer}>
    <Text style={RNStyles.statText}>{label}: {value}</Text>
    <View style={RNStyles.progressBarBase}>
      <View 
        style={[
          RNStyles.progressBarFill, 
          { width: `${(value / max) * 100}%`, backgroundColor: color }
        ]} 
      />
    </View>
  </View>
);

// --- COMPONENTĂ PRINCIPALĂ ---
export default function Game({ navigation }) { 
  const [hunger, setHunger] = usePersistentState("pet_hunger", 50);
  const [cleanliness, setCleanliness] = usePersistentState("pet_cleanliness", 50);
  const [happiness, setHappiness] = usePersistentState("pet_happiness", 50);
  const [foodMenuVisible, setFoodMenuVisible] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [scrubCount, setScrubCount] = usePersistentState("scrub_count", 0);
  const CLEAN_THRESHOLD = 5;
  const [showPlayMenu, setShowPlayMenu] = useState(false);

  // 2. Funcția care redă sunetul
  async function playSound(soundFile) {
    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      // Descărcăm sunetul din memorie după ce a terminat (opțional, dar recomandat)
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Nu am putut reda sunetul (verifică numele fișierului):", error);
    }
  }

  // Cronometru
  useEffect(() => {
    const interval = setInterval(() => {
      setHunger(h => Math.min(100, h + 2));
      setCleanliness(c => Math.max(0, c - 1));
      setHappiness(h => Math.max(0, h - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check game result
  useEffect(() => {
    const checkGameResult = async () => {
        const result = await AsyncStorage.getItem("game_result");

        if (result === "win") {
          playSound(happySoundFile); // Redăm sunet de fericire
          setHappiness(100);
          setHunger(h => Math.max(0, h - 20));
        }

        if (result === "lose") {
          setHappiness(h => Math.min(100, h + 5));
        }

        await AsyncStorage.removeItem("game_result");
    }
    checkGameResult();
  }, []);

  const getPetImage = () => {
    if (hunger >= 70) return dogHungry;
    if (cleanliness <= 30) return dogDirty;
    if (happiness <= 30) return dogSad;
    return dogHappy;
  };

  const getAlertMessage = () => {
    if (hunger >= 85) return "🚨 Imi este FOAME!";
    if (cleanliness <= 15) return "🧼 Sunt foarte murdar!";
    if (happiness <= 15) return "😭 Sunt trist! Hai să ne jucăm!";
    return null;
  };

  const toggleFoodMenu = () => {
    if (!isCleaning) setFoodMenuVisible(v => !v);
  };

  const selectFood = (foodType) => {
    let hungerChange = 0;
    let happinessChange = 0;

    if (foodType === "biscuit") { hungerChange = -20; happinessChange = 10; }
    if (foodType === "steak") { hungerChange = -40; happinessChange = 20; }
    if (foodType === "vegetables") { hungerChange = -10; happinessChange = 5; }

    setHunger(h => Math.max(0, h + hungerChange));
    setHappiness(h => Math.min(100, h + happinessChange));

    setFoodMenuVisible(false);
    playSound(eatSoundFile); // Redăm sunet de mâncare
  };

  const startCleaning = () => {
    if (!isCleaning) {
      setIsCleaning(true);
      setScrubCount(0);
    }
  };

  const performScrub = () => {
    if (!isCleaning) return;

    playSound(washSoundFile); // Redăm sunet de spălat
    const newCount = scrubCount + 1;
    setScrubCount(newCount);

    if (newCount >= CLEAN_THRESHOLD) {
      setCleanliness(c => Math.min(100, c + 30));
      setHappiness(h => Math.min(100, h + 10));
      setIsCleaning(false);
      setScrubCount(0);
      playSound(happySoundFile); // Bonus sound la final de spălare
    }
  };

  const playWithPet = () => {
    if (!isCleaning) setShowPlayMenu(true);
  };
  
  const navigateToGame = (screenName) => {
      setShowPlayMenu(false);
      navigation.navigate(screenName);
  }

  return (
    <ScrollView contentContainerStyle={RNStyles.app}>
      <Text style={RNStyles.title}>Virtual Pet</Text>

      <TouchableOpacity 
        onPress={performScrub} 
        activeOpacity={0.8}
        style={isCleaning ? RNStyles.cleaningMode : {}}
      >
        <Image
          source={getPetImage()}
          style={RNStyles.petImage}
          resizeMode="contain" 
        />
      </TouchableOpacity>
      
      {getAlertMessage() && (
        <View style={RNStyles.alertMessageContainer}>
          <Text style={RNStyles.alertMessageText}>{getAlertMessage()}</Text>
        </View>
      )}

      {isCleaning && (
        <View style={RNStyles.cleaningStatusContainer}>
          <Text style={RNStyles.cleaningStatusText}>🧼 {scrubCount} / {CLEAN_THRESHOLD}</Text>
        </View>
      )}

      {foodMenuVisible && (
        <View style={RNStyles.foodMenu}>
          <Text style={RNStyles.foodMenuTitle}>Alege mâncare:</Text>
          <TouchableOpacity onPress={() => selectFood("biscuit")} style={RNStyles.foodMenuButton}>
            <Text style={RNStyles.foodMenuButtonText}>🍪 Biscuit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => selectFood("steak")} style={RNStyles.foodMenuButton}>
            <Text style={RNStyles.foodMenuButtonText}>🥩 Steak</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => selectFood("vegetables")} style={RNStyles.foodMenuButton}>
            <Text style={RNStyles.foodMenuButtonText}>🥗 Legume</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={RNStyles.stats}>
        <ProgressBar value={hunger} max={100} label="Hunger" />
        <ProgressBar value={cleanliness} max={100} label="Cleanliness" />
        <ProgressBar value={happiness} max={100} label="Happiness" />
      </View>

      <View style={RNStyles.buttons}>
        <TouchableOpacity onPress={toggleFoodMenu} style={RNStyles.actionButton}>
            <Text style={RNStyles.actionButtonText}>🍲 Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={startCleaning} style={RNStyles.actionButton}>
            <Text style={RNStyles.actionButtonText}>🧼 Clean</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={playWithPet} style={RNStyles.actionButton}>
            <Text style={RNStyles.actionButtonText}>⚽ Play</Text>
        </TouchableOpacity>
      </View>
      
      {showPlayMenu && (
        <View style={RNStyles.playMenu}>
          <Text style={RNStyles.playMenuTitle}>Alege jocul:</Text>
          <TouchableOpacity onPress={() => navigateToGame("MiniGame")} style={RNStyles.playMenuButton}>
            <Text style={RNStyles.playMenuButtonText}>🎮 MiniGame</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateToGame("DinoGame")} style={RNStyles.playMenuButton}>
            <Text style={RNStyles.playMenuButtonText}>🦖 Dino Runner</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPlayMenu(false)} style={[RNStyles.playMenuButton, RNStyles.closeButton]}>
            <Text style={RNStyles.closeButtonText}>✖ Închide</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

// --- STILURI ---
const RNStyles = StyleSheet.create({
  app: {
    flexGrow: 1, 
    backgroundColor: "#d2b48c", 
    alignItems: "center",
    paddingTop: 40, 
    paddingBottom: 60, 
    minHeight: Dimensions.get('window').height, 
  },
  title: {
    color: "#fff8dc",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30, 
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  petImage: {
    width: 240,
    height: 240, 
    marginBottom: 40,
  },
  cleaningMode: { 
    borderWidth: 3,
    borderColor: "#ff0000",
    borderRadius: 5, 
    shadowColor: "#ff0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5, 
  },
  alertMessageContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 3,
    borderColor: "#ff0000",
    borderRadius: 8,
    marginVertical: 15,
    marginHorizontal: 10,
  },
  alertMessageText: {
      color: "#ff0000",
      fontWeight: "bold",
      fontSize: 18,
      textAlign: 'center',
  },
  cleaningStatusContainer: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff0000", 
    backgroundColor: "#e6f7ff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 15,
  },
  foodMenu: {
    backgroundColor: "#8b5a2b",
    borderWidth: 3,
    borderColor: "#d4af37",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  foodMenuTitle: {
    color: "#fff8dc",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: 'center',
  },
  foodMenuButton: {
    width: "100%",
    marginVertical: 4, 
    backgroundColor: "#a0522d",
    padding: 10,
    borderRadius: 8,
  },
  foodMenuButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  stats: {
    width: "90%",
    maxWidth: 350,
    marginTop: 40,
    marginBottom: 40,
  },
  statBarContainer: {
    marginBottom: 15,
  },
  statText: {
    fontWeight: "bold",
    color: "#4a4a4a",
    marginBottom: 5,
    fontSize: 16,
  },
  progressBarBase: {
    width: "100%",
    height: 12,
    borderRadius: 10,
    backgroundColor: "#fff", 
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: 'hidden', 
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  buttons: {
    flexDirection: "row", 
    justifyContent: "space-between",
    width: "90%",
    maxWidth: 350,
    marginTop: 20,
  },
  actionButton: {
    flex: 1, 
    marginHorizontal: 5,
    backgroundColor: "#ffd700",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtonText: {
    color: "#4a4a4a",
    fontWeight: "bold",
    textAlign: "center",
  },
  playMenu: {
    position: 'absolute', 
    top: '20%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 10,
    zIndex: 10,
    width: '80%',
  },
  playMenuTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playMenuButton: {
      backgroundColor: '#a0522d',
      padding: 10,
      borderRadius: 5,
      marginVertical: 5,
  },
  playMenuButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
  },
  closeButton: {
      backgroundColor: 'gray',
      marginTop: 15,
  },
  closeButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
  }
});
