import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// A clean, modern color palette
const COLORS = {
    primary: '#4F46E5', // Indigo
    background: '#F3F4F6', // Light Gray
    card: '#FFFFFF',
    text: '#111827', // Dark Gray
    textLight: '#6B7280', // Medium Gray
    input: '#F9FAFB',
    border: '#D1D5DB',
};

// API URL (Make sure to use your computer's IP address)
const API_URL = 'https://snaptile.ir/api'; // Example IP

// --- Sign In Form Component ---
const SignInForm = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.log('Server Error Response:', error.response.data);
                const errorMessage = error.response.data.message || 'Invalid username or password.';
                Alert.alert('Sign In Failed', errorMessage);
            } else {
                console.log(error);
                Alert.alert('Sign In Failed', 'An unexpected error occurred. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={COLORS.textLight}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            <Pressable style={styles.button} onPress={handleSignIn} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
        </View>
    );
};

// --- Sign Up Form Component ---
const SignUpForm = ({ onSignUpSuccess }: { onSignUpSuccess: () => void }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [refCode, setRefCode] = useState(''); // State for referral code
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !username || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/register`, {
                full_name: fullName,
                username: username,
                password: password,
                ref_code: refCode,
            });
            Alert.alert('Success', 'Account created successfully! Please sign in.');
            onSignUpSuccess();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                console.log(responseData)
                if (responseData && responseData.error) {
                    Alert.alert('Sign Up Failed', responseData.error);
                } else {
                    Alert.alert('Sign Up Failed', 'An unexpected error occurred.');
                }
            } else {
                console.log(error);
                Alert.alert('Sign Up Failed', 'A network error occurred. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.textLight} value={fullName} onChangeText={setFullName} />
            </View>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.textLight} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            {/* New Referral Code Input */}
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Referral Code (Optional)" placeholderTextColor={COLORS.textLight} value={refCode} onChangeText={setRefCode} autoCapitalize="none" />
            </View>
            <Pressable style={styles.button} onPress={handleSignUp} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </Pressable>
        </View>
    );
};

// --- Main Auth Screen Component ---
export default function AuthScreen() {
    const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.wrapper}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>SnapTile</Text>
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.card}
                >
                    {/* Tab Switcher */}
                    <View style={styles.tabContainer}>
                        <Pressable
                            style={[styles.tabButton, activeTab === 'signIn' && styles.activeTabButton]}
                            onPress={() => setActiveTab('signIn')}
                        >
                            <Text style={[styles.tabText, activeTab === 'signIn' && styles.activeTabText]}>Sign In</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tabButton, activeTab === 'signUp' && styles.activeTabButton]}
                            onPress={() => setActiveTab('signUp')}
                        >
                            <Text style={[styles.tabText, activeTab === 'signUp' && styles.activeTabText]}>Sign Up</Text>
                        </Pressable>
                    </View>

                    {/* Form Display with animation on change */}
                    <MotiView
                        key={activeTab} // This makes the animation re-run on tab change
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300 }}
                    >
                        {activeTab === 'signIn' ? <SignInForm /> : <SignUpForm onSignUpSuccess={() => setActiveTab('signIn')} />}
                    </MotiView>
                </MotiView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center', // Vertically center the content
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 40,
        textAlign: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 15,
        padding: 5,
        marginBottom: 25,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    activeTabButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    activeTabText: {
        color: COLORS.card,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        backgroundColor: COLORS.input,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.card,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
