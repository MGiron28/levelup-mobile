import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, theme } from '../theme/colors';
import { useMemo } from 'react';
import { themes, theme as baseTheme } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

export default function CreateQuizScreen() {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const appTheme = useAppStore(state => state.appTheme);
    const colors = themes[appTheme];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const updateOption = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleCreateQuiz = async () => {
        // 1. Validaciones
        if (!question.trim()) return Alert.alert('Hold on!', 'Please write a question.');
        if (options.some(opt => !opt.trim())) return Alert.alert('Hold on!', 'Please fill all 4 options.');
        if (correctIndex === null) return Alert.alert('Hold on!', 'Please select which option is the correct one.');

        setIsSubmitting(true);

        const optionsArray = options.map(opt => opt.trim());
        const correctAnswer = optionsArray[correctIndex];

        // 2. Enviar a Supabase
        const { error } = await supabase
            .from('quiz_questions')
            .insert([
                {
                    question: question.trim(),
                    options: optionsArray,
                    correct_answer: correctAnswer,
                    is_active: true,
                }
            ]);

        setIsSubmitting(false);

        // 3. Manejar el resultado
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success! 🎉', 'Question added to the Quiz!');
            // Limpiar formulario para la siguiente pregunta
            setQuestion('');
            setOptions(['', '', '', '']);
            setCorrectIndex(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>New Quiz Question</Text>
                    <Text style={styles.subtitle}>Test Susy's English knowledge</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Question</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g. Which word is a synonym for 'cozy'?"
                        value={question}
                        onChangeText={setQuestion}
                        multiline
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>Options (Check the correct one)</Text>

                    {options.map((opt, index) => (
                        <View key={index} style={styles.optionRow}>
                            {/* Botón de selección de respuesta correcta */}
                            <TouchableOpacity
                                style={[styles.radioBtn, correctIndex === index && styles.radioBtnSelected]}
                                onPress={() => setCorrectIndex(index)}
                            >
                                {correctIndex === index && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </TouchableOpacity>

                            {/* Campo de texto de la opción */}
                            <TextInput
                                style={[styles.input, styles.optionInput, correctIndex === index && styles.inputSelected]}
                                placeholder={`Option ${index + 1}`}
                                value={opt}
                                onChangeText={(text) => updateOption(text, index)}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleCreateQuiz}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Publish Question</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 40 },
    header: { padding: 24, backgroundColor: colors.surface, borderBottomLeftRadius: baseTheme.borderRadius.large, borderBottomRightRadius: baseTheme.borderRadius.large, ...theme.shadows.soft, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    form: { paddingHorizontal: 24 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: baseTheme.borderRadius.medium, padding: 12, fontSize: 16, color: colors.text, marginBottom: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    radioBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    radioBtnSelected: { borderColor: colors.success, backgroundColor: colors.success },
    optionInput: { flex: 1, marginBottom: 0 },
    inputSelected: { borderColor: colors.success, borderWidth: 2 },
    submitButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: baseTheme.borderRadius.round, alignItems: 'center', marginTop: 20, ...theme.shadows.soft },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});