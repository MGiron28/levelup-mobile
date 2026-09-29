import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { colors, theme } from '../theme/colors';
import { useMemo } from 'react';
import { themes, theme as baseTheme } from '../theme/colors';

export default function QuizScreen() {
  const addXP = useAppStore(state => state.addXP);
  const quizQuestions = useAppStore(state => state.quizQuestions);
  const fetchQuizQuestions = useAppStore(state => state.fetchQuizQuestions);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const appTheme = useAppStore(state => state.appTheme);
  const colors = themes[appTheme];
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Cargamos las preguntas al abrir la pantalla
  useEffect(() => {
    fetchQuizQuestions();
  }, []);

  const currentQuestion = quizQuestions[currentQIndex];

  const handleStart = () => {
    if (quizQuestions.length === 0) return; // Seguridad: no iniciar si está vacío
    setGameState('playing');
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || !currentQuestion) return; // Evita doble toque

    setSelectedAnswer(answer);

    if (answer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    // Esperar 1.5 segundos antes de pasar a la siguiente
    setTimeout(() => {
      if (currentQIndex < quizQuestions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  const handleCollectReward = () => {
    const xpEarned = score * 50;
    addXP(xpEarned);
    setGameState('start');
  };

  if (gameState === 'start') {
    const hasQuestions = quizQuestions.length > 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Weekend Challenge</Text>
          <Text style={styles.subtitle}>Test your English and earn massive XP!</Text>
          <TouchableOpacity
            style={[styles.startButton, !hasQuestions && { opacity: 0.5 }]}
            onPress={handleStart}
            disabled={!hasQuestions}
          >
            <Text style={styles.startButtonText}>
              {hasQuestions ? 'Start Weekly Quiz' : 'Loading questions...'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'finished') {
    const xpEarned = score * 50;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Quiz Completed! 🎉</Text>
          <Text style={styles.scoreText}>You got {score} out of {quizQuestions.length} correct.</Text>

          <View style={styles.rewardBox}>
            <Text style={styles.rewardText}>+{xpEarned} XP</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleCollectReward}>
            <Text style={styles.startButtonText}>Collect XP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Si por alguna razón currentQuestion no existe, mostramos un loader
  if (!currentQuestion) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Question {currentQIndex + 1} of {quizQuestions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option) => {
          let bgColor = colors.surface;
          let textColor = colors.text;
          let borderColor = colors.border;

          if (selectedAnswer) {
            if (option === currentQuestion.correctAnswer) {
              bgColor = colors.success;
              textColor = '#fff';
              borderColor = colors.success;
            } else if (option === selectedAnswer) {
              bgColor = colors.error;
              textColor = '#fff';
              borderColor = colors.error;
            }
          }

          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleAnswer(option)}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, alignItems: 'center' },
  progressText: { fontSize: 16, color: colors.textSecondary, fontWeight: 'bold' },
  questionContainer: { paddingHorizontal: 20, paddingVertical: 30, minHeight: 150, justifyContent: 'center' },
  questionText: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', lineHeight: 32 },
  optionsContainer: { padding: 20, gap: 16 },
  optionButton: { paddingVertical: 18, paddingHorizontal: 20, borderRadius: baseTheme.borderRadius.large, borderWidth: 2, ...baseTheme.shadows.soft },
  optionText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, textAlign: 'center' },
  startButton: { backgroundColor: colors.secondary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: baseTheme.borderRadius.round, ...baseTheme.shadows.soft },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scoreText: { fontSize: 20, color: colors.textSecondary, marginBottom: 30 },
  rewardBox: { backgroundColor: colors.xp, paddingVertical: 15, paddingHorizontal: 30, borderRadius: theme.borderRadius.medium, marginBottom: 40 },
  rewardText: { fontSize: 24, fontWeight: 'bold', color: '#fff' }
});