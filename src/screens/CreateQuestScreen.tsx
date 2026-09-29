import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { themes, theme as baseTheme } from '../theme/colors';

export default function CreateQuestScreen() {
    const navigation = useNavigation();
    const session = useAppStore(state => state.session);
    const role = useAppStore(state => state.role);
    const appTheme = useAppStore(state => state.appTheme);
    const colors = themes[appTheme];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [xpReward, setXpReward] = useState('50');
    const [loading, setLoading] = useState(false);

    const handleCreateQuest = async () => {
        if (!title.trim()) return Alert.alert('Error', 'The quest needs a title!');

        setLoading(true);
        try {
            let targetAssigneeId = session?.user?.id; // Por defecto (Solo Player) se asigna a sí mismo

            // Si es Game Master, buscamos el ID del Party Member vinculado
            if (role === 'game_master') {
                const { data: studentData, error: studentError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('teacher_id', session?.user?.id)
                    .limit(1)
                    .single();

                if (studentError || !studentData) {
                    throw new Error('No Party Member linked to your account yet. Share your Invite Code first!');
                }
                targetAssigneeId = studentData.id;
            }

            // Insertamos la misión en la base de datos
            const { error: insertError } = await supabase.from('quests').insert({
                creator_id: session?.user?.id,
                assignee_id: targetAssigneeId,
                title: title.trim(),
                description: description.trim(),
                xp_reward: parseInt(xpReward, 10) || 10,
                status: 'pending'
            });

            if (insertError) throw insertError;

            Alert.alert('Success! 🎉', 'Quest added to the board.');
            navigation.goBack(); // Regresa a la lista de misiones

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Quest</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Quest Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Complete Chapter 1"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Mission Details</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add lore or specific instructions..."
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                        />

                        <Text style={styles.label}>XP Reward</Text>
                        <View style={styles.xpInputContainer}>
                            <Ionicons name="star" size={20} color={colors.warning} style={styles.xpIcon} />
                            <TextInput
                                style={styles.xpInput}
                                keyboardType="number-pad"
                                value={xpReward}
                                onChangeText={setXpReward}
                                maxLength={4}
                            />
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateQuest} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Post Quest</Text>}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    formContainer: { padding: 24 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: baseTheme.borderRadius.medium, padding: 16, fontSize: 16, color: colors.text },
    textArea: { height: 120 },
    xpInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: baseTheme.borderRadius.medium, paddingHorizontal: 16 },
    xpIcon: { marginRight: 8 },
    xpInput: { flex: 1, paddingVertical: 16, fontSize: 18, color: colors.text, fontWeight: 'bold' },
    primaryButton: { backgroundColor: colors.primary, padding: 16, borderRadius: baseTheme.borderRadius.round, alignItems: 'center', marginTop: 32 },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});