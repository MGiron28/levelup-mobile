import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { themes, theme as baseTheme } from '../theme/colors';
import * as Linking from 'expo-linking';

export default function AuthScreen() {
    const appTheme = useAppStore(state => state.appTheme);
    const colors = themes[appTheme];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // ✨ Actualizamos los 3 roles oficiales
    const [role, setRole] = useState<'party_member' | 'game_master' | 'solo_player'>('party_member');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');

        // ✨ Validación adaptada para el Party Member
        if (!isLogin && role === 'party_member' && !inviteCode.trim()) {
            return Alert.alert('Hold on', 'Party Members need an invite code from their Game Master.');
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                let teacherId = null;
                let newInviteCode = null;

                // 1. Party Member: Busca al GM
                if (role === 'party_member') {
                    const { data: teacherData, error: teacherError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('invite_code', inviteCode.trim().toUpperCase())
                        .single();

                    if (teacherError || !teacherData) {
                        throw new Error('Invalid invite code. Please check with your Game Master.');
                    }
                    teacherId = teacherData.id;
                }
                // 2. Game Master: Genera código
                else if (role === 'game_master') {
                    newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                }
                // 3. Solo Player: No necesita código ni GM (ambos se quedan como null)

                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: Linking.createURL(''),
                        data: {
                            role: role,
                            invite_code: newInviteCode,
                            teacher_id: teacherId
                        }
                    }
                });

                if (signUpError) throw signUpError;

                Alert.alert('Welcome! 🎉', 'Your account has been created. Please check your email to confirm.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? 'Log in to continue your journey.' : 'Choose your path and start your adventure.'}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textSecondary}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    {!isLogin && (
                        <View style={styles.roleContainer}>
                            <Text style={styles.roleLabel}>Select your role:</Text>

                            {/* ✨ Diseño vertical para los 3 roles */}
                            <View style={styles.roleButtons}>
                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'party_member' && styles.roleBtnActive]}
                                    onPress={() => setRole('party_member')}
                                >
                                    <Ionicons name="people" size={22} color={role === 'party_member' ? '#fff' : colors.textSecondary} />
                                    <View style={styles.roleTextContainer}>
                                        <Text style={[styles.roleBtnText, role === 'party_member' && { color: '#fff' }]}>Party Member</Text>
                                        <Text style={[styles.roleBtnSubtext, role === 'party_member' && { color: '#fff', opacity: 0.8 }]}>Join a Game Master's campaign</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'game_master' && styles.roleBtnActive]}
                                    onPress={() => setRole('game_master')}
                                >
                                    <Ionicons name="cube" size={22} color={role === 'game_master' ? '#fff' : colors.textSecondary} />
                                    <View style={styles.roleTextContainer}>
                                        <Text style={[styles.roleBtnText, role === 'game_master' && { color: '#fff' }]}>Game Master</Text>
                                        <Text style={[styles.roleBtnSubtext, role === 'game_master' && { color: '#fff', opacity: 0.8 }]}>Create and manage quests</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'solo_player' && styles.roleBtnActive]}
                                    onPress={() => setRole('solo_player')}
                                >
                                    <Ionicons name="person" size={22} color={role === 'solo_player' ? '#fff' : colors.textSecondary} />
                                    <View style={styles.roleTextContainer}>
                                        <Text style={[styles.roleBtnText, role === 'solo_player' && { color: '#fff' }]}>Solo Player</Text>
                                        <Text style={[styles.roleBtnSubtext, role === 'solo_player' && { color: '#fff', opacity: 0.8 }]}>Track personal goals & habits</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Input condicional solo para el Party Member */}
                            {role === 'party_member' && (
                                <TextInput
                                    style={[styles.input, { marginTop: 16 }]}
                                    placeholder="Enter Game Master's Code"
                                    placeholderTextColor={colors.textSecondary}
                                    autoCapitalize="characters"
                                    value={inviteCode}
                                    onChangeText={setInviteCode}
                                />
                            )}
                        </View>
                    )}

                    <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
                        <Text style={styles.switchText}>
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ✨ Estilos ajustados
const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: colors.surface, padding: 24, borderRadius: baseTheme.borderRadius.large, ...baseTheme.shadows.medium },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: baseTheme.borderRadius.medium, padding: 16, fontSize: 16, marginBottom: 16, color: colors.text },

    roleContainer: { marginBottom: 24 },
    roleLabel: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 12 },
    roleButtons: { flexDirection: 'column', gap: 12 },

    roleBtn: { flexDirection: 'row', padding: 16, borderRadius: baseTheme.borderRadius.medium, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },

    roleTextContainer: { marginLeft: 16, flex: 1 },
    roleBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary },
    roleBtnSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    primaryButton: { backgroundColor: colors.primary, padding: 16, borderRadius: baseTheme.borderRadius.round, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    switchText: { textAlign: 'center', color: colors.secondary, fontWeight: 'bold', fontSize: 14 }
});