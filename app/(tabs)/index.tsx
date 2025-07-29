import React, { useState, useCallback } from 'react';
import {View, Text, StyleSheet, Pressable, Alert, Image, Modal, ActivityIndicator} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = 'https://snaptile.ir/api';

const COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    textOnPrimary: '#FFFFFF',
    border: '#E5E7EB',
    easy: '#22C55E',
    medium: '#F59E0B',
    hard: '#EF4444',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    completedTask: '#9CA3AF',
    taskButton: '#3B82F6', // A different blue for the task button
};

// --- Data Structures ---
interface Task {
    id: number;
    title: string;
    completed: boolean;
}

interface StageDetails {
    full_name: string;
    user_name: string;
    user_avatar: string;
    level: number;
    level_title: string;
    level_image: string;
    progress: number;
    tasks: Task[];
}

// --- Components ---

const UserInfoHeader = ({ user }: { user: StageDetails | null }) => {
    const router = useRouter();
    if (!user) return null;

    const handleProfilePress = () => router.push('/(tabs)/profile');

    return (
        <Pressable onPress={handleProfilePress}>
            <View style={styles.headerCard}>
                <Image source={{ uri: user.user_avatar }} style={styles.avatar} />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.username}>{user.full_name}</Text>
                    <Text style={styles.level}>{user.user_name}</Text>
                    <View style={styles.xpBarContainer}>
                        <View style={[styles.xpBarFill, { width: `${user.progress}%` }]}>
                            <Text style={styles.xpBarText}>{`${user.progress}%`}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const levelImages = {
    'Bear Strong': require('../../assets/images/levels/Bear Strong.jpg'),
    'Cat Quick': require('../../assets/images/levels/Cat Quick.jpg'),
    'Deer Swift': require('../../assets/images/levels/Deer Swift.jpg'),
    'Dog Loyal': require('../../assets/images/levels/Dog Loyal.jpg'),
    'Eagle Sharp': require('../../assets/images/levels/Eagle Sharp.jpg'),
    'Fox Clever': require('../../assets/images/levels/Fox Clever.jpg'),
    'Panther Silent': require('../../assets/images/levels/Panther Silent.jpg'),
    'Rabbit Calm': require('../../assets/images/levels/Rabbit Calm.jpg'),
    'Tiger Brave': require('../../assets/images/levels/Tiger Brave.jpg'),
    'Wolf Fierce': require('../../assets/images/levels/Wolf Fierce.jpg'),
};

const StageTasks = ({ level, level_title, tasks }: { level: number, level_title: string, tasks: Task[] }) => {
    const imageSource = levelImages[level_title] || levelImages.default;

    return (
        <View style={styles.tasksContainer}>
            <Text style={styles.tasksTitle}>{`Level ${level}: ${level_title}`}</Text>
            <View style={styles.levelImageContainer}>
                <Image
                    source={imageSource}
                    style={styles.levelImage}
                    resizeMode="cover"
                />
            </View>

            {tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                    <Feather
                        name={task.completed ? "check-square" : "square"}
                        size={22}
                        color={task.completed ? COLORS.completedTask : COLORS.primary}
                    />
                    <Text style={[styles.taskText, task.completed && styles.completedTaskText]}>
                        {task.title}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const getColorForLevel = (level: number) => {
    const startColor = { r: 34, g: 197, b: 94 }; // Green
    const endColor = { r: 239, g: 68, b: 68 };   // Red
    const ratio = (level - 1) / 5;

    const r = Math.round(startColor.r * (1 - ratio) + endColor.r * ratio);
    const g = Math.round(startColor.g * (1 - ratio) + endColor.g * ratio);
    const b = Math.round(startColor.b * (1 - ratio) + endColor.b * ratio);

    return `rgb(${r}, ${g}, ${b})`;
};

export default function HomeScreen() {
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [stageDetails, setStageDetails] = useState<StageDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shuffleLevel, setShuffleLevel] = useState(3);

    useFocusEffect(
        useCallback(() => {
            const fetchStageDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await axios.get(`${API_URL}/user/stage-info`);
                    setStageDetails(response.data);
                } catch (error) {
                    const errorMessage = axios.isAxiosError(error) && error.response
                        ? JSON.stringify(error.response.data)
                        : "Could not load your stage details.";
                    Alert.alert("Error", errorMessage);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStageDetails();
        }, [])
    );

    const handleStartGameWithSettings = (gridSize: number) => {
        setIsModalVisible(false);
        const shuffleMoves = shuffleLevel * 30;
        router.push({
            pathname: '/game',
            params: {
                gridSize: gridSize.toString(),
                shuffleMoves: shuffleMoves.toString(),
                mode: 'FreePlay'
            }
        });
    };

    const handlePlayForTask = () => {
        if (!stageDetails || !stageDetails.tasks) return;
        const nextTask = stageDetails.tasks.find(task => !task.completed);
        if (nextTask) {
            router.push({pathname: '/taskGame', params: {taskId: nextTask.id.toString()}});
        } else {
            Alert.alert("Stage Complete!", "You have completed all tasks for this stage.");
        }
    };
    const handleStartFreePlay = () => setIsModalVisible(true);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, {justifyContent: 'center'}]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <UserInfoHeader user={stageDetails} />

            {stageDetails && (
                <StageTasks
                    level={stageDetails.level}
                    level_title={stageDetails.level_title}
                    tasks={stageDetails.tasks}
                />
            )}

            <View style={styles.menuContainer}>
                <Pressable style={[styles.menuButton, {backgroundColor: COLORS.taskButton}]} onPress={handlePlayForTask}>
                    <Feather name="target" size={22} color={COLORS.textOnPrimary} />
                    <Text style={styles.menuButtonText}>Complete Next Task</Text>
                </Pressable>
                <Pressable style={styles.menuButton} onPress={handleStartFreePlay}>
                    <Feather name="play-circle" size={22} color={COLORS.textOnPrimary} />
                    <Text style={styles.menuButtonText}>Free Play</Text>
                </Pressable>
            </View>

            <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Free Play Settings</Text>

                        <Text style={styles.modalSubtitle}>Difficulty</Text>
                        <View style={styles.shuffleContainer}>
                            <View style={styles.shuffleSelector}>
                                <View style={styles.shuffleTrack} />
                                {Array.from({length: 6}, (_, i) => i + 1).map(level => (
                                    <Pressable key={level} onPress={() => setShuffleLevel(level)} style={styles.shufflePointWrapper}>
                                        <View style={[styles.shufflePoint, { backgroundColor: getColorForLevel(level) }, shuffleLevel === level && styles.shufflePointSelected]} />
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.shuffleLabels}>
                                <Text style={styles.shuffleLabelText}>Easy</Text>
                                <Text style={styles.shuffleLabelText}>Hard</Text>
                            </View>
                        </View>

                        <Text style={styles.modalSubtitle}>Grid Size</Text>
                        <View style={styles.gridSizeSelector}>
                            <Pressable style={styles.gridSizeButton} onPress={() => handleStartGameWithSettings(3)}>
                                <Text style={styles.gridSizeButtonText}>3 x 3</Text>
                            </Pressable>
                            <Pressable style={styles.gridSizeButton} onPress={() => handleStartGameWithSettings(4)}>
                                <Text style={styles.gridSizeButtonText}>4 x 4</Text>
                            </Pressable>
                            <Pressable style={styles.gridSizeButton} onPress={() => handleStartGameWithSettings(5)}>
                                <Text style={styles.gridSizeButtonText}>5 x 5</Text>
                            </Pressable>
                        </View>

                        <Pressable style={[styles.difficultyButton, { backgroundColor: '#e7e7e7', marginTop: 20 }]} onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    headerCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 },
    avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.primary },
    headerTextContainer: { flex: 1, marginLeft: 15 },
    username: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    level: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
    xpBarContainer: { height: 20, backgroundColor: COLORS.border, borderRadius: 10, marginTop: 8, overflow: 'hidden' },
    xpBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    xpBarText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    tasksContainer: {backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 4,},
    tasksTitle: {fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 10,},
    levelImageContainer: {width: 160, height: 160, borderRadius: 80, borderColor: 'rgb(164,202,255)', borderWidth: 4, padding: 5, alignSelf: 'center', marginTop: 15, marginBottom: 15,},
    levelImage: {width: '100%', height: '100%', borderRadius: 75,},
    taskItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8,},
    taskText: {fontSize: 16, color: COLORS.text, marginLeft: 10,},
    completedTaskText: {color: COLORS.completedTask, textDecorationLine: 'line-through'},
    menuContainer: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 320, alignSelf: 'center' },
    menuButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 18, paddingHorizontal: 25, borderRadius: 12, marginBottom: 15, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    menuButtonText: { color: COLORS.textOnPrimary, fontSize: 18, fontWeight: '600', marginLeft: 15 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.modalBackdrop },
    modalContent: { width: '85%', maxWidth: 340, backgroundColor: COLORS.card, borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
    modalSubtitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 15, alignSelf: 'center' },
    shuffleContainer: { width: '100%', marginBottom: 25, alignItems: 'center' },
    shuffleSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', position: 'relative' },
    shuffleTrack: { position: 'absolute', height: 4, backgroundColor: COLORS.border, width: '100%', borderRadius: 2 },
    shufflePointWrapper: { padding: 5 },
    shufflePoint: { width: 18, height: 18, borderRadius: 9, zIndex: 1 },
    shufflePointSelected: { width: 28, height: 28, borderRadius: 14, borderWidth: 4, borderColor: COLORS.card, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 2 },
    shuffleLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginTop: 5 },
    shuffleLabelText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
    gridSizeSelector: { width: '100%' },
    gridSizeButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
    gridSizeButtonText: { color: COLORS.textOnPrimary, fontSize: 18, fontWeight: 'bold' },
    difficultyButton: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderRadius: 12, justifyContent: 'center' },
    closeButtonText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
});
