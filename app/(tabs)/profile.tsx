import React, {useCallback, useEffect, useState} from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image, FlatList, TextInput, ScrollView } from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

// A clean, modern color palette
const COLORS = {
    primary: '#4F46E5',
    danger: '#EF4444',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    inputBackground: '#F9FAFB',
};

// API URL (Make sure to use your computer's IP address)
const API_URL = 'https://snaptile.ir/api'; // Example IP

interface User {
    id: number;
    full_name: string;
    username: string;
    created_at: string;
    avatar?: string; // Matches server response
}

// Generate a list of 100 avatar URLs for the selector
const avatarList = Array.from({ length: 100 }, (_, i) => `https://avatar.iran.liara.run/public/${i + 1}`);

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = useAuth(); // Get logout function from context
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvatar, setUpdatingAvatar] = useState<string | null>(null);

    // States for editing user info
    const [isEditing, setIsEditing] = useState(false);
    const [editingFullName, setEditingFullName] = useState('');
    const [editingUsername, setEditingUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);


    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`${API_URL}/user`);
                    const userData = { ...response.data, avatar: response.data.avatar || `https://avatar.iran.liara.run/public/${response.data.username}` };
                    setUser(userData);
                    setEditingFullName(userData.full_name);
                    setEditingUsername(userData.username);
                } catch (error) {
                    Alert.alert('Error', 'Could not fetch user data.');
                } finally {
                    setLoading(false);
                }
            };

            fetchUserData();

            return () => {};
        }, [])
    );
    const handleAvatarChange = async (newAvatar: string) => {
        if (updatingAvatar) return;
        setUpdatingAvatar(newAvatar);
        try {
            const response = await axios.post(`${API_URL}/user/change-avatar`, { avatar: newAvatar });
            if (response.status === 200) {
                if (user) setUser({ ...user, avatar: newAvatar });
                Alert.alert('Success', 'Avatar updated successfully!');
            } else {
                throw new Error('Server responded with an error.');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                if (responseData && responseData.errors) {
                    const errorMessages = Object.values(responseData.errors).flat();
                    Alert.alert('Update Failed', errorMessages[0] as string || 'Invalid data provided.');
                } else {
                    Alert.alert('Error', responseData.message || 'Failed to update avatar.');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        } finally {
            setUpdatingAvatar(null);
        }
    };

    const handleSaveChanges = async () => {
        if (!editingFullName || !editingUsername) {
            Alert.alert('Error', 'Fields cannot be empty.');
            return;
        }
        setIsSaving(true);
        try {
            const response = await axios.post(`${API_URL}/user/update-profile`, {
                full_name: editingFullName,
                username: editingUsername,
            });
            if (response.status === 200) {
                if(user) setUser({ ...user, full_name: editingFullName, username: editingUsername });
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully!');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                if (responseData && responseData.errors) {
                    const errorMessages = Object.values(responseData.errors).flat();
                    Alert.alert('Update Failed', errorMessages[0] as string || 'An unknown validation error occurred.');
                } else {
                    Alert.alert('Update Failed', responseData.message || 'An unexpected error occurred.');
                }
            } else {
                console.error(error);
                Alert.alert('Error', 'A network error occurred. Please check your connection.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if(user) {
            setEditingFullName(user.full_name);
            setEditingUsername(user.username);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => logout() }
            ]
        );
    };


    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {user ? (
                    <>
                        <Image source={{ uri: user.avatar }} style={styles.mainAvatar} />

                        <View style={styles.infoCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>User Information</Text>
                                {!isEditing && (
                                    <Pressable onPress={() => setIsEditing(true)}>
                                        <Feather name="edit-2" size={20} color={COLORS.primary} />
                                    </Pressable>
                                )}
                            </View>
                            <View style={styles.infoRow}>
                                <Feather name="user" size={20} color={COLORS.primary} />
                                {isEditing ? (
                                    <TextInput style={styles.textInput} value={editingFullName} onChangeText={setEditingFullName} />
                                ) : (
                                    <Text style={styles.infoValue}>{user.full_name}</Text>
                                )}
                            </View>
                            <View style={styles.infoRow}>
                                <Feather name="at-sign" size={20} color={COLORS.primary} />
                                {isEditing ? (
                                    <TextInput style={styles.textInput} value={editingUsername} onChangeText={setEditingUsername} />
                                ) : (
                                    <Text style={styles.infoValue}>{user.username}</Text>
                                )}
                            </View>
                            {isEditing && (
                                <View style={styles.editActions}>
                                    <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancelEdit}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.button} onPress={handleSaveChanges} disabled={isSaving}>
                                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Save</Text>}
                                    </Pressable>
                                </View>
                            )}
                        </View>

                        <View style={styles.avatarGridCard}>
                            <Text style={styles.cardTitle}>Choose Your Avatar</Text>
                            <FlatList
                                data={avatarList}
                                scrollEnabled={false} // THIS IS THE FIX
                                renderItem={({ item }) => (
                                    <Pressable onPress={() => handleAvatarChange(item)} style={styles.avatarSelectItem}>
                                        <Image source={{ uri: item }} style={styles.avatarImage} />
                                        {updatingAvatar === item && (
                                            <View style={styles.avatarLoadingOverlay}>
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            </View>
                                        )}
                                    </Pressable>
                                )}
                                keyExtractor={(item) => item}
                                numColumns={4}
                                showsVerticalScrollIndicator={true} // Make scrollbar visible
                                columnWrapperStyle={{ justifyContent: 'center' }}
                            />
                        </View>

                        <Pressable style={styles.logoutButton} onPress={handleLogout}>
                            <Feather name="log-out" size={20} color={COLORS.danger} />
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </Pressable>
                    </>
                ) : (
                    <View style={styles.center}><Text>No user data found.</Text></View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    backButton: { padding: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginLeft: 15 },
    mainAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: COLORS.primary, alignSelf: 'center', marginTop: 10, marginBottom: 20 },
    infoCard: { backgroundColor: COLORS.card, borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, marginHorizontal: 20, marginBottom: 20 },
    avatarGridCard: {
        // height: 350, // We remove the fixed height to let ScrollView handle the size
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 15, flex: 1 },
    textInput: { fontSize: 16, color: COLORS.text, flex: 1, marginLeft: 15, backgroundColor: COLORS.inputBackground, padding: 10, borderRadius: 8 },
    avatarSelectItem: { width: 65, height: 65, borderRadius: 32.5, margin: 5, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 32.5 },
    avatarLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 32.5 },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    button: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10, minWidth: 80, alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: 'bold' },
    cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textLight },
    cancelButtonText: { color: COLORS.textLight, fontWeight: 'bold' },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.danger,
        marginBottom: 20,
    },
    logoutButtonText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    }
});
