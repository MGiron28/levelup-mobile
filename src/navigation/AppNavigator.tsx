import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { themes } from '../theme/colors';

// Pantallas de Pestañas (Tabs)
import QuestsScreen from '../screens/QuestsScreen';
import QuizScreen from '../screens/QuizScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManageContentScreen from '../screens/ManageContentScreen';

// Pantallas Completas (Stack)
import CreateQuestScreen from '../screens/CreateQuestScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import CreateRewardScreen from '../screens/CreateRewardScreen';
import AuthScreen from '../screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ✨ 1. Definimos la barra inferior (Tab Navigator)
function MainTabNavigator() {
  const role = useAppStore(state => state.role);
  const appTheme = useAppStore(state => state.appTheme);
  const colors = themes[appTheme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Quests') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'Quiz') iconName = focused ? 'game-controller' : 'game-controller-outline';
          if (route.name === 'Rewards') iconName = focused ? 'trophy' : 'trophy-outline';
          if (route.name === 'Manage') iconName = focused ? 'list' : 'list-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      {/* ✨ Todos los roles ven estas pestañas principales */}
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />

      {/* ✨ Solo GM y Solo Player ven la pestaña de administración */}
      {(role === 'game_master' || role === 'solo_player') && (
        <Tab.Screen name="Manage" component={ManageContentScreen} />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ✨ 2. Definimos el enrutador principal (Stack Navigator)
export default function AppNavigator() {
  const session = useAppStore(state => state.session);
  const setSession = useAppStore(state => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si no hay sesión, mostramos Auth
  if (!session) {
    return <AuthScreen />;
  }

  // Si hay sesión, cargamos el Stack que contiene los Tabs y las pantallas de creación
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* El Tab Navigator es la pantalla principal */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Pantallas que se abren por encima (Full Screen) */}
      <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
      <Stack.Screen name="CreateReward" component={CreateRewardScreen} />
      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
    </Stack.Navigator>
  );
}