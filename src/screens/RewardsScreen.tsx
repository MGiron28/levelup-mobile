import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { themes, theme as baseTheme } from '../theme/colors';

export default function RewardsScreen() {
  const xpPoints = useAppStore(state => state.xpPoints);
  const rewards = useAppStore(state => state.rewards);
  const fetchRewards = useAppStore(state => state.fetchRewards);
  const unlockReward = useAppStore(state => state.unlockReward);
  const appTheme = useAppStore(state => state.appTheme);
  const colors = themes[appTheme];
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Traemos el rol actual y la función para cambiarlo
  const role = useAppStore(state => state.role);
  const setRole = useAppStore(state => state.setRole);

  // Función para alternar entre profesor y estudiante
  const toggleRole = () => {
    setRole(role === 'student' ? 'teacher' : 'student');
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        {/* Botón para cambiar de rol */}
        <TouchableOpacity style={styles.roleButton} onPress={toggleRole}>
          <Text style={styles.roleButtonText}>
            Switch to {role === 'student' ? 'Teacher' : 'Student'} Mode
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>Total XP</Text>
          <Text style={styles.xpValue}>{xpPoints}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Inventory & Store</Text>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const canAfford = xpPoints >= item.cost;

          return (
            <View style={[styles.rewardCard, !item.unlocked && styles.lockedCard]}>
              <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} />
              <Text style={styles.rewardName}>{item.name}</Text>

              {!item.unlocked && (
                <View style={styles.purchaseContainer}>
                  {canAfford ? (
                    <TouchableOpacity
                      style={styles.unlockButton}
                      onPress={() => unlockReward(item.id)}
                    >
                      <Text style={styles.unlockButtonText}>Unlock: {item.cost} XP</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledButton}>
                      <Text style={styles.disabledButtonText}>Need {item.cost - xpPoints} XP</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: { padding: 24, backgroundColor: colors.surface, borderBottomLeftRadius: baseTheme.borderRadius.large, borderBottomRightRadius: baseTheme.borderRadius.large, alignItems: 'center', ...baseTheme.shadows.soft, marginBottom: 20 },

  // Estilos del nuevo botón
  roleButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: baseTheme.borderRadius.medium, marginBottom: 16 },
  roleButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  xpContainer: { backgroundColor: colors.accent, paddingVertical: 12, paddingHorizontal: 32, borderRadius: baseTheme.borderRadius.round, alignItems: 'center' },
  xpLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: 'bold' },
  xpValue: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginHorizontal: 20, marginBottom: 12 },
  gridContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  rewardCard: { backgroundColor: colors.surface, borderRadius: baseTheme.borderRadius.medium, width: '47%', padding: 12, alignItems: 'center', ...baseTheme.shadows.soft, borderWidth: 2, borderColor: colors.border },
  lockedCard: { backgroundColor: '#fafafa' },
  rewardImage: { width: 100, height: 100, borderRadius: baseTheme.borderRadius.small, marginBottom: 8 },
  rewardName: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 8 },
  purchaseContainer: { width: '100%', marginTop: 'auto' },
  unlockButton: { backgroundColor: colors.success, paddingVertical: 8, borderRadius: baseTheme.borderRadius.small, alignItems: 'center' },
  unlockButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  disabledButton: { backgroundColor: colors.border, paddingVertical: 8, borderRadius: baseTheme.borderRadius.small, alignItems: 'center' },
  disabledButtonText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }
});