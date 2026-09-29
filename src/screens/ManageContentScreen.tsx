import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';
import { themes, theme as baseTheme } from '../theme/colors';

export default function ManageContentScreen() {
    const [activeTab, setActiveTab] = useState<'quests' | 'quizzes' | 'rewards' | 'review'>('quests');
    const appTheme = useAppStore(state => state.appTheme);
    const colors = themes[appTheme];
    const styles = useMemo(() => getStyles(colors), [colors]);

    // ✨ Estados para controlar el reproductor de audio
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const quests = useAppStore(state => state.quests);
    const quizQuestions = useAppStore(state => state.quizQuestions);
    const rewards = useAppStore(state => state.rewards);
    const submissions = useAppStore(state => state.submissions);

    const fetchQuests = useAppStore(state => state.fetchQuests);
    const fetchQuizQuestions = useAppStore(state => state.fetchQuizQuestions);
    const fetchRewards = useAppStore(state => state.fetchRewards);
    const fetchSubmissions = useAppStore(state => state.fetchSubmissions);
    const approveSubmission = useAppStore(state => state.approveSubmission);
    const rejectSubmission = useAppStore(state => state.rejectSubmission);

    useEffect(() => {
        fetchQuests();
        fetchQuizQuestions();
        fetchRewards();
        fetchSubmissions();
    }, []);

    // ✨ Limpieza: Detener el audio si el profesor sale de la pantalla
    useEffect(() => {
        return sound
            ? () => { sound.unloadAsync(); }
            : undefined;
    }, [sound]);

    // ✨ Nueva lógica inteligente para reproducir audio
    const handlePlayAudio = async (url: string, submissionId: string) => {
        try {
            // Si tocamos el mismo audio que ya está sonando, lo detenemos
            if (playingId === submissionId && sound) {
                await sound.stopAsync();
                setPlayingId(null);
                return;
            }

            // Si hay OTRO audio sonando, lo descargamos primero
            if (sound) {
                await sound.unloadAsync();
            }

            setPlayingId(submissionId);
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            setSound(newSound);

            // Escuchar cuando el audio termine para reiniciar el botón
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });
        } catch (error) {
            Alert.alert('Error', 'Could not play the audio file.');
            setPlayingId(null);
        }
    };

    const handleDeleteQuest = (id: string) => {
        Alert.alert('Delete Quest', 'Are you sure you want to delete this quest?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const { error } = await supabase.from('quests').delete().eq('id', id);
                    if (error) Alert.alert('Error', error.message);
                    else { Alert.alert('Deleted', 'Quest removed.'); fetchQuests(); }
                }
            }
        ]);
    };

    const handleDeleteQuiz = (id: string) => {
        Alert.alert('Delete Question', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
                    if (error) Alert.alert('Error', error.message);
                    else { Alert.alert('Deleted', 'Question removed.'); fetchQuizQuestions(); }
                }
            }
        ]);
    };

    const handleDeleteReward = (id: string) => {
        Alert.alert('Delete Reward', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const { error } = await supabase.from('rewards').delete().eq('id', id);
                    if (error) Alert.alert('Error', error.message);
                    else { Alert.alert('Deleted', 'Reward removed.'); fetchRewards(); }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Content</Text>
                <Text style={styles.subtitle}>Review submissions or delete content</Text>
            </View>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'quests' && styles.activeTab]} onPress={() => setActiveTab('quests')}>
                        <Text style={[styles.tabText, activeTab === 'quests' && styles.activeTabText]}>Quests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]} onPress={() => setActiveTab('quizzes')}>
                        <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>Quiz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'rewards' && styles.activeTab]} onPress={() => setActiveTab('rewards')}>
                        <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>Rewards</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'review' && styles.activeTab]} onPress={() => setActiveTab('review')}>
                        <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>Review ({submissions.length})</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {activeTab === 'quests' && (
                <FlatList data={quests} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.xpReward} XP</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteQuest(item.id)} style={styles.deleteButton}>
                                <Ionicons name="trash" size={24} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No quests found.</Text>}
                />
            )}

            {activeTab === 'quizzes' && (
                <FlatList data={quizQuestions} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{item.question}</Text>
                                <Text style={styles.cardSubtitle}>Correct: {item.correctAnswer}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteQuiz(item.id)} style={styles.deleteButton}>
                                <Ionicons name="trash" size={24} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No quiz questions found.</Text>}
                />
            )}

            {activeTab === 'rewards' && (
                <FlatList data={rewards} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: item.imageUrl }} style={styles.rewardThumbnail} />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardSubtitle}>{item.cost} XP</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteReward(item.id)} style={styles.deleteButton}>
                                <Ionicons name="trash" size={24} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No rewards found.</Text>}
                />
            )}

            {activeTab === 'review' && (
                <FlatList
                    data={submissions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const questInfo = Array.isArray(item.quests) ? item.quests[0] : item.quests;
                        const isPlaying = playingId === item.id; // ✨ Verificamos si este audio en particular está sonando

                        return (
                            <View style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewQuestTitle}>{questInfo?.title || 'Unknown Quest'}</Text>
                                    <View style={styles.xpBadge}>
                                        <Text style={styles.xpText}>+{questInfo?.points_reward || 0} XP</Text>
                                    </View>
                                </View>

                                {questInfo?.type === 'image' ? (
                                    <Image source={{ uri: item.content_url }} style={styles.reviewImage} />
                                ) : questInfo?.type === 'audio' ? (
                                    <TouchableOpacity
                                        style={[styles.playAudioButton, isPlaying && { backgroundColor: colors.primary }]}
                                        onPress={() => handlePlayAudio(item.content_url, item.id)}
                                    >
                                        <Ionicons name={isPlaying ? "stop-circle" : "play-circle"} size={24} color="#fff" />
                                        <Text style={styles.playAudioText}>
                                            {isPlaying ? "Playing..." : "Play Audio Evidence"}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.reviewTextContainer}>
                                        <Text style={styles.reviewTextContent}>"{item.content_url}"</Text>
                                    </View>
                                )}

                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity
                                        style={styles.rejectButton}
                                        onPress={() => rejectSubmission(item.id)}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}> Reject</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.approveButton}
                                        onPress={() => approveSubmission(item.id, item.quest_id, questInfo?.points_reward || 0)}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}> Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending submissions right now.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 24, backgroundColor: colors.surface, borderBottomLeftRadius: baseTheme.borderRadius.large, borderBottomRightRadius: baseTheme.borderRadius.large, ...baseTheme.shadows.soft, marginBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    tabContainer: { marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surface, borderRadius: baseTheme.borderRadius.medium, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    tab: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
    activeTab: { backgroundColor: colors.primary },
    tabText: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
    activeTabText: { color: '#fff' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: baseTheme.borderRadius.medium, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...baseTheme.shadows.soft },
    cardContent: { flex: 1, justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: colors.textSecondary },
    deleteButton: { padding: 8, backgroundColor: '#ffe5e5', borderRadius: 8, marginLeft: 12 },
    rewardThumbnail: { width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: colors.textSecondary },

    reviewCard: { backgroundColor: colors.surface, padding: 20, borderRadius: baseTheme.borderRadius.large, marginBottom: 16, borderWidth: 1, borderColor: colors.border, ...baseTheme.shadows.medium },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    reviewQuestTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 12 },
    xpBadge: { backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: baseTheme.borderRadius.small },
    xpText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    reviewImage: { width: '100%', height: 200, borderRadius: baseTheme.borderRadius.medium, marginBottom: 16, backgroundColor: colors.border },
    reviewTextContainer: { backgroundColor: colors.background, padding: 16, borderRadius: baseTheme.borderRadius.medium, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    reviewTextContent: { fontSize: 16, fontStyle: 'italic', color: colors.text },

    playAudioButton: { flexDirection: 'row', backgroundColor: colors.secondary, padding: 16, borderRadius: baseTheme.borderRadius.medium, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    playAudioText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    rejectButton: { flex: 1, flexDirection: 'row', backgroundColor: colors.error, paddingVertical: 12, borderRadius: baseTheme.borderRadius.round, alignItems: 'center', justifyContent: 'center' },
    approveButton: { flex: 2, flexDirection: 'row', backgroundColor: colors.success, paddingVertical: 12, borderRadius: baseTheme.borderRadius.round, alignItems: 'center', justifyContent: 'center' },
    actionButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});