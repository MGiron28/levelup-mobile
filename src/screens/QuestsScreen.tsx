import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { themes, theme as baseTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

export default function QuestsScreen() {
  const navigation = useNavigation();
  const role = useAppStore(state => state.role);
  const appTheme = useAppStore(state => state.appTheme);
  const colors = themes[appTheme];
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    // ✨ El RLS hace la magia: solo trae lo que te pertenece
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuests(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuests();
  };

  const renderQuest = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.questCard} activeOpacity={0.8}>
      <View style={styles.questHeader}>
        <View style={styles.statusDot} />
        <Text style={styles.questTitle}>{item.title}</Text>
      </View>
      {item.description ? (
        <Text style={styles.questDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.questFooter}>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.xpText}>+{item.xp_reward} XP</Text>
        </View>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="map-outline" size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>No active quests</Text>
      <Text style={styles.emptySubtitle}>
        {role === 'party_member'
          ? 'Wait for your Game Master to assign a new mission.'
          : 'Tap the + button to create your first objective.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quest Board</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={quests}
          keyExtractor={(item) => item.id}
          renderItem={renderQuest}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* ✨ Solo el GM o el Solo Player pueden crear misiones */}
      {(role === 'game_master' || role === 'solo_player') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateQuest' as never)}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24, flexGrow: 1 },

  questCard: { backgroundColor: colors.surface, padding: 16, borderRadius: baseTheme.borderRadius.medium, marginBottom: 16, borderWidth: 1, borderColor: colors.border, ...baseTheme.shadows.soft },
  questHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.warning, marginRight: 12 },
  questTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  questDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  questFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: baseTheme.borderRadius.round },
  xpText: { color: colors.warning, fontWeight: 'bold', marginLeft: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...baseTheme.shadows.medium }
});