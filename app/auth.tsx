import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
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
    const [refCode, setRefCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

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
                console.log(responseData);
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
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            <Text style={styles.modalTitle}>Privacy Policy</Text>
                            <Text style={styles.modalText}>
                                Last Updated: August 2, 2025
                            </Text>
                            <Text style={styles.modalText}>
                                At SnapTile, we respect your privacy and are committed to protecting your personal information. This document explains what information we collect from you, why we need it, and how we protect it.
                            </Text>
                            <Text style={styles.modalText}>
                                Please read this policy carefully before registering and using our services. Your use of this application constitutes your full acceptance of these policies.
                            </Text>
                            <Text style={styles.modalSubtitle}>1. Information We Collect</Text>
                            <Text style={styles.modalText}>
                                To provide better services and create a personalized user experience, we collect the following information:
                            </Text>
                            <Text style={styles.modalSubsection}>Information You Provide Directly:</Text>
                            <Text style={styles.modalText}>
                                - Full Name: To personalize your user account.
                                {"\n"}- Username: To uniquely identify you in the game and for logging into your account.
                                {"\n"}- Password: To protect your account (your password is stored securely and in an encrypted format).
                                {"\n"}- Avatar: The image you choose for your profile.
                                {"\n"}- Referral Code (Optional): If you were referred by another user.
                            </Text>
                            <Text style={styles.modalSubsection}>Information Collected Automatically:</Text>
                            <Text style={styles.modalText}>
                                - Game-related Data: Your progress in levels, number of moves, time spent solving puzzles, and the status of completed tasks.
                            </Text>
                            <Text style={styles.modalSubtitle}>2. Why We Collect This Information</Text>
                            <Text style={styles.modalText}>
                                The collected information is used for the following purposes:
                            </Text>
                            <Text style={styles.modalText}>
                                - Account Creation and Management: To allow you to have a user account, log in, and save your progress.
                                {"\n"}- Personalizing Your Experience: To display your name and avatar within the game environment.
                                {"\n"}- Improving Our Services: Analyzing gameplay data helps us improve the game and design more engaging levels.
                                {"\n"}- Core Game Functionality: To save your progress in levels and tasks for you to continue playing in future sessions.
                            </Text>
                            <Text style={styles.modalSubtitle}>3. Data Protection and Security</Text>
                            <Text style={styles.modalText}>
                                The security of your information is our top priority. We are committed to:
                            </Text>
                            <Text style={styles.modalText}>
                                - Keeping your personal information secure.
                                {"\n"}- Using secure protocols (such as HTTPS) for data transmission between the application and our servers.
                                {"\n"}- Storing your password in a hashed (encrypted) format, to which we have no access.
                            </Text>
                            <Text style={styles.modalSubtitle}>4. No Sharing with Third Parties</Text>
                            <Text style={styles.modalText}>
                                We commit that we will not sell, rent, or share your personal information with any third-party person or organization under any circumstances. All collected information is used solely for the purposes stated in this document and to improve your experience in the SnapTile game.
                            </Text>
                            <Text style={styles.modalSubtitle}>5. Changes to This Privacy Policy</Text>
                            <Text style={styles.modalText}>
                                This policy may be updated in the future. In the event of any significant changes, you will be notified through the application. Your continued use of the application after changes are implemented will constitute your acceptance of the new policies.
                            </Text>
                            <Text style={styles.modalSubtitle}>6. Contact Us</Text>
                            <Text style={styles.modalText}>
                                If you have any questions about this policy, you can contact us at support@snaptile.ir.
                            </Text>
                        </ScrollView>
                        <Pressable
                            style={[styles.button, styles.modalCloseButton]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.textLight} value={fullName} onChangeText={setFullName} />
            </View>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.textLight} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Referral Code (Optional)" placeholderTextColor={COLORS.textLight} value={refCode} onChangeText={setRefCode} autoCapitalize="none" />
            </View>
            <Pressable style={styles.button} onPress={handleSignUp} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </Pressable>
            <View style={styles.privacyContainer}>
                <Text style={styles.privacyText}>
                    By creating an account, you agree to our{' '}
                    <Text style={styles.privacyLink} onPress={() => setModalVisible(true)}>
                        Privacy Policy
                    </Text>
                </Text>
            </View>
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
                    <MotiView
                        key={activeTab}
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
        justifyContent: 'center',
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
    privacyContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    privacyText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    privacyLink: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        maxHeight: '80%',
        width: '90%',
    },
    modalScroll: {
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 15,
        marginBottom: 10,
    },
    modalSubsection: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginTop: 10,
        marginBottom: 5,
    },
    modalText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 10,
    },
    modalCloseButton: {
        marginTop: 15,
    },
});