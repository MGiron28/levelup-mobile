import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // ✨ Nueva herramienta para copiar
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { themes, theme as baseTheme, ThemeName } from '../theme/colors';

export default function ProfileScreen() {
    const role = useAppStore(state => state.role);
    const xpPoints = useAppStore(state => state.xpPoints);
    const logout = useAppStore(state => state.logout);
    const session = useAppStore(state => state.session); // ✨ Necesitamos la sesión para buscar el código

    const appTheme = useAppStore(state => state.appTheme);
    const setAppTheme = useAppStore(state => state.setAppTheme);
    const colors = themes[appTheme];

    const styles = useMemo(() => getStyles(colors), [colors]);

    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null); // ✨ Estado para guardar el código

    // ✨ Buscamos el código en Supabase cuando la pantalla carga (solo si es profesor)
    useEffect(() => {
        if (role === 'teacher' && session?.user?.id) {
            const fetchInviteCode = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('invite_code')
                    .eq('id', session.user.id)
                    .single();

                if (data && !error) {
                    setInviteCode(data.invite_code);
                }
            };
            fetchInviteCode();
        }
    }, [role, session]);

    const handleComingSoon = (feature: string) => {
        Alert.alert('Coming Soon! 🚀', `${feature} will be available in the next major update.`);
    };

    const changeTheme = (newTheme: ThemeName) => {
        setAppTheme(newTheme);
        setThemeModalVisible(false);
    };

    // ✨ Función para copiar al portapapeles
    const copyToClipboard = async () => {
        if (inviteCode) {
            await Clipboard.setStringAsync(inviteCode);
            Alert.alert('Copied! 📋', 'Invite code copied to clipboard. Share it with your students!');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ENCABEZADO DEL PERFIL */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: role === 'student' ? 'https://api.dicebear.com/9.x/notionists/png?seed=Susy' : 'https://api.dicebear.com/9.x/notionists/png?seed=Teacher' }}
                            style={styles.avatar}
                        />
                        <View style={styles.badge}>
                            <Ionicons name={role === 'student' ? 'school' : 'briefcase'} size={16} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>{role === 'student' ? 'Student' : 'Game Master'}</Text>
                    <Text style={styles.roleText}>{role === 'student' ? 'Student Account' : 'Teacher Account'}</Text>
                </View>

                {/* TARJETA DE ESTADÍSTICAS */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={32} color={colors.warning} />
                        <Text style={styles.statValue}>{xpPoints}</Text>
                        <Text style={styles.statLabel}>Total XP</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Ionicons name="trophy" size={32} color={colors.primary} />
                        <Text style={styles.statValue}>Lv. 3</Text>
                        <Text style={styles.statLabel}>Current Rank</Text>
                    </View>
                </View>

                {/* ✨ TARJETA DEL CÓDIGO DE INVITACIÓN (Solo para profesores) */}
                {role === 'teacher' && inviteCode && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Classroom</Text>
                        <TouchableOpacity style={styles.codeCard} onPress={copyToClipboard}>
                            <View>
                                <Text style={styles.codeLabel}>Your Invite Code</Text>
                                <Text style={styles.codeValue}>{inviteCode}</Text>
                            </View>
                            <Ionicons name="copy-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* SECCIÓN: PREFERENCIAS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <TouchableOpacity style={styles.settingRow} onPress={() => setThemeModalVisible(true)}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.settingText}>App Theme ({appTheme.charAt(0).toUpperCase() + appTheme.slice(1)})</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow} onPress={() => handleComingSoon('Push Notifications')}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.settingText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* SECCIÓN: CUENTA */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.settingRow} onPress={logout}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        </View>
                        <Text style={[styles.settingText, { color: colors.error }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* MODAL DE SELECCIÓN DE TEMA */}
            <Modal visible={themeModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose a Theme</Text>

                        <TouchableOpacity style={styles.themeOption} onPress={() => changeTheme('cozy')}>
                            <View style={[styles.themeColorPreview, { backgroundColor: themes.cozy.primary }]} />
                            <Text style={styles.themeOptionText}>Cozy (Default)</Text>
                            {appTheme === 'cozy' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.themeOption} onPress={() => changeTheme('dark')}>
                            <View style={[styles.themeColorPreview, { backgroundColor: themes.dark.background }]} />
                            <Text style={styles.themeOptionText}>Dark Mode</Text>
                            {appTheme === 'dark' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.themeOption} onPress={() => changeTheme('ocean')}>
                            <View style={[styles.themeColorPreview, { backgroundColor: themes.ocean.primary }]} />
                            <Text style={styles.themeOptionText}>Ocean Blue</Text>
                            {appTheme === 'ocean' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setThemeModalVisible(false)}>
                            <Text style={styles.modalCancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 24, paddingBottom: 40 },

    profileHeader: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.primary },
    badge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.background },
    name: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    roleText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },

    statsCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: baseTheme.borderRadius.large, padding: 20, marginBottom: 32, ...baseTheme.shadows.medium, borderWidth: 1, borderColor: colors.border },
    statItem: { flex: 1, alignItems: 'center' },
    divider: { width: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 },
    statLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16, marginLeft: 4 },

    // ✨ Estilos de la nueva tarjeta del código
    codeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary + '15', padding: 20, borderRadius: baseTheme.borderRadius.medium, borderWidth: 1, borderColor: colors.primary + '30', marginBottom: 12 },
    codeLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    codeValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary, letterSpacing: 4 },

    settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: baseTheme.borderRadius.medium, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...baseTheme.shadows.soft },
    settingIcon: { width: 40, height: 40, borderRadius: baseTheme.borderRadius.small, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    settingText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: baseTheme.borderRadius.large, borderTopRightRadius: baseTheme.borderRadius.large, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
    themeOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    themeColorPreview: { width: 24, height: 24, borderRadius: 12, marginRight: 16, borderWidth: 1, borderColor: colors.border },
    themeOptionText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
    modalCancelButton: { marginTop: 24, paddingVertical: 16, alignItems: 'center', backgroundColor: colors.background, borderRadius: baseTheme.borderRadius.medium },
    modalCancelText: { color: colors.text, fontSize: 16, fontWeight: 'bold' }
});