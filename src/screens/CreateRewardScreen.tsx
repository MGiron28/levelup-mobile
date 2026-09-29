import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useMemo } from 'react';
import { themes, theme as baseTheme } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

export default function CreateRewardScreen() {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null); // ✨ Guardamos el texto base64 aquí
    const [isSubmitting, setIsSubmitting] = useState(false);
    const appTheme = useAppStore(state => state.appTheme);
    const colors = themes[appTheme];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true, // ✨ TRUCO NUEVO: Le pedimos a la galería que nos dé el Base64 directamente
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 ?? null);
        }
    };

    const handleCreateReward = async () => {
        if (!name.trim() || !cost) {
            return Alert.alert('Hold on!', 'Please provide a name and a cost.');
        }

        setIsSubmitting(true);
        let finalImageUrl = `https://picsum.photos/seed/${name.trim()}/200`;

        try {
            if (imageBase64) {
                const fileName = `${Date.now()}-reward.jpg`;

                // ✨ Convertimos el texto Base64 a datos binarios (ArrayBuffer)
                const arrayBuffer = decode(imageBase64);

                // Subimos a Supabase
                const { error: uploadError } = await supabase.storage
                    .from('app-images')
                    .upload(fileName, arrayBuffer, {
                        contentType: 'image/jpeg',
                    });

                if (uploadError) throw uploadError;

                // Obtenemos el link público
                const { data: publicUrlData } = supabase.storage
                    .from('app-images')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrlData.publicUrl;
            }

            // Guardamos en la base de datos
            const { error: dbError } = await supabase
                .from('rewards')
                .insert([{
                    name: name.trim(),
                    cost: parseInt(cost),
                    image_url: finalImageUrl,
                }]);

            if (dbError) throw dbError;

            Alert.alert('Success! 🎉', 'New reward added with image!');
            setName('');
            setCost('');
            setImageUri(null);
            setImageBase64(null);

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>New Reward</Text>
                <Text style={styles.subtitle}>Add prizes to the store</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Reward Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Sushi Night!"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Cost (XP)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    value={cost}
                    onChangeText={setCost}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Reward Image</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                            <Text style={styles.imagePlaceholderText}>Choose from Gallery</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleCreateReward}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Publish Reward</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 24, backgroundColor: colors.surface, borderBottomLeftRadius: baseTheme.borderRadius.large, borderBottomRightRadius: baseTheme.borderRadius.large, ...baseTheme.shadows.soft, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    form: { paddingHorizontal: 24 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: baseTheme.borderRadius.medium, padding: 12, fontSize: 16, color: colors.text, marginBottom: 16 },
    imagePickerBtn: { marginBottom: 20, alignItems: 'center' },
    imagePlaceholder: { width: '100%', height: 120, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: baseTheme.borderRadius.medium, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    imagePlaceholderText: { color: colors.textSecondary, marginTop: 8, fontWeight: 'bold' },
    imagePreview: { width: 120, height: 120, borderRadius: baseTheme.borderRadius.medium },
    submitButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: baseTheme.borderRadius.round, alignItems: 'center', ...baseTheme.shadows.soft },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});