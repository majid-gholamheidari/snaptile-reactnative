import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Feather} from '@expo/vector-icons';
import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import axios from 'axios';

// Type definition for a puzzle piece
interface Piece {
    value: number | null;
}

const API_URL = 'https://snaptile.ir/api';

// Color palette for a classic look
const COLORS = {
    background: '#F3F4F6',
    board: '#BFDBFE',
    piece: '#3B82F6',
    pieceText: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    card: '#FFFFFF',
    primary: '#4F46E5',
    danger: '#EF4444',
    success: '#10B981', // Added success color
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

// --- Sizing Calculations ---
const { width } = Dimensions.get('window');
const BOARD_MARGIN = 20;

const generatePuzzle = (gridSize: number, shuffleMoves: number) => {
    const totalPieces = gridSize * gridSize;
    let pieces: (number | null)[] = Array.from({ length: totalPieces - 1 }, (_, i) => i + 1);
    pieces.push(null);

    let emptyIndex = pieces.length - 1;

    for (let i = 0; i < shuffleMoves; i++) {
        const neighbors = [];
        const row = Math.floor(emptyIndex / gridSize);
        const col = emptyIndex % gridSize;

        if (row > 0) neighbors.push(emptyIndex - gridSize);
        if (row < gridSize - 1) neighbors.push(emptyIndex + gridSize);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < gridSize - 1) neighbors.push(emptyIndex + 1);

        const moveIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
        [pieces[emptyIndex], pieces[moveIndex]] = [pieces[moveIndex], pieces[emptyIndex]];
        emptyIndex = moveIndex;
    }

    return pieces.map(val => ({ value: val }));
};

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); // Get params from previous screen

    const [pieces, setPieces] = useState<Piece[]>([]);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [modalState, setModalState] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
    const [winModalVisible, setWinModalVisible] = useState(false); // State for the win modal

    const [loading, setLoading] = useState(true);
    const [gridSize, setGridSize] = useState(3);
    const [shuffleMoves, setShuffleMoves] = useState(50);
    const [gameId, setGameId] = useState<string | null>(null); // State to store the game ID

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startTimer = () => {
        stopTimer();
        setTime(0);
        timerRef.current = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
    };

    const initializeGame = useCallback(async () => {
        setLoading(true);
        setWinModalVisible(false); // Hide win modal on restart
        try {
            const size = parseInt(params.gridSize as string, 10) || 3;
            const shuffles = parseInt(params.shuffleMoves as string, 10) || 50;

            const response = await axios.post(`${API_URL}/game/create`, {
                game_type: "free_play",
                grid: size,
                moves: shuffles
            });

            setGameId(response.data.game_id);
            setGridSize(size);
            setShuffleMoves(shuffles);
            setPieces(generatePuzzle(size, shuffles));
            setMoves(0);
            startTimer();
        } catch (error) {
            console.error("Failed to initialize game:", error);
            Alert.alert("Error", "Could not create a new game.", [{ text: "Go Back", onPress: () => router.back() }]);
        } finally {
            setLoading(false);
        }
    }, [params.gridSize, params.shuffleMoves]);

    useEffect(() => {
        initializeGame();
        return () => stopTimer();
    }, [initializeGame]);

    const checkWinCondition = useCallback((currentPieces: Piece[]) => {
        for (let i = 0; i < currentPieces.length - 1; i++) {
            if (currentPieces[i].value !== i + 1) return false;
        }
        return currentPieces[currentPieces.length - 1].value === null;
    }, []);

    const handleGameWin = async (finalMoves: number, finalTime: number) => {
        if (!gameId) {
            Alert.alert("Error", "Game ID is missing. Cannot save result.");
            return;
        }
        try {
            await axios.post(`${API_URL}/game/complete`, {
                game_id: gameId
            });
            // Show the win modal instead of an alert
            setWinModalVisible(true);
        } catch (error) {
            console.error("Failed to complete game:", error);
            Alert.alert("Error", "Could not save your game result, but congratulations on winning!");
        }
    };

    const handlePiecePress = (pressedIndex: number) => {
        const emptyIndex = pieces.findIndex(p => p.value === null);
        if (emptyIndex === -1) return;

        const { row: pressedRow, col: pressedCol } = { row: Math.floor(pressedIndex / gridSize), col: pressedIndex % gridSize };
        const { row: emptyRow, col: emptyCol } = { row: Math.floor(emptyIndex / gridSize), col: emptyIndex % gridSize };

        const isAdjacent = (Math.abs(pressedRow - emptyRow) === 1 && pressedCol === emptyCol) || (Math.abs(pressedCol - emptyCol) === 1 && pressedRow === emptyRow);

        if (isAdjacent) {
            const newPieces = [...pieces];
            [newPieces[pressedIndex], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[pressedIndex]];

            setPieces(newPieces);
            const newMoveCount = moves + 1;
            setMoves(newMoveCount);

            if (checkWinCondition(newPieces)) {
                stopTimer();
                handleGameWin(newMoveCount, time);
            }
        }
    };

    const getDifficultyText = () => {
        if (shuffleMoves <= 60) return 'Easy';
        if (shuffleMoves <= 120) return 'Medium';
        return 'Hard';
    };

    const handleRestartRequest = () => setModalState({ visible: true, title: 'Restart Game', message: 'Are you sure you want to restart?', onConfirm: () => { initializeGame(); setModalState({ ...modalState, visible: false }); } });
    const handleBackRequest = () => setModalState({ visible: true, title: 'Exit Game', message: 'Are you sure you want to exit?', onConfirm: () => { router.back(); setModalState({ ...modalState, visible: false }); } });

    useFocusEffect(useCallback(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { handleBackRequest(); return true; }); return () => sub.remove(); }, [handleBackRequest]));

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading Game...</Text>
            </SafeAreaView>
        );
    }

    const boardSize = width - (BOARD_MARGIN * 2);
    const gap = 12;
    const pieceSize = Math.floor((boardSize - (gridSize + 1) * gap) / gridSize);

    return (
        <SafeAreaView style={styles.container}>
            <Modal transparent={true} visible={modalState.visible} animationType="fade" onRequestClose={() => setModalState({ ...modalState, visible: false })}>
                <View style={styles.modalOverlay}><View style={styles.modalContainer}><Text style={styles.modalTitle}>{modalState.title}</Text><Text style={styles.modalMessage}>{modalState.message}</Text><View style={styles.modalActions}><Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setModalState({ ...modalState, visible: false })}><Text style={styles.modalButtonTextCancel}>Cancel</Text></Pressable><Pressable style={[styles.modalButton, styles.modalButtonConfirm]} onPress={modalState.onConfirm}><Text style={styles.modalButtonTextConfirm}>Confirm</Text></Pressable></View></View></View>
            </Modal>

            {/* --- NEW: Win Modal --- */}
            <Modal transparent={true} visible={winModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Feather name="award" size={40} color={COLORS.success} />
                        <Text style={styles.modalTitle}>Congratulations!</Text>
                        <Text style={styles.modalMessage}>You solved the puzzle!</Text>
                        <View style={styles.winStats}>
                            <Text style={styles.winStatText}>Moves: {moves}</Text>
                            <Text style={styles.winStatText}>Time: {formatTime(time)}</Text>
                        </View>
                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => router.back()}><Text style={styles.modalButtonTextCancel}>Start New Game</Text></Pressable>
                            {/*<Pressable style={[styles.modalButton, {backgroundColor: COLORS.success}]} onPress={initializeGame}><Text style={styles.modalButtonTextConfirm}>Start New Game</Text></Pressable>*/}
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}><Text style={styles.headerTitle}>Slide Puzzle</Text></View>

            <View style={styles.mainContent}>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Game ID:</Text><Text style={styles.infoValue}>{gameId || '...'}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Grid Size:</Text><Text style={styles.infoValue}>{`${gridSize} x ${gridSize}`}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Difficulty:</Text><Text style={styles.infoValue}>{getDifficultyText()}</Text></View>
                </View>

                <View style={styles.statsRow}><View style={styles.moveCard}>
                    <Text style={styles.statValue}>{moves}</Text>
                    <Text style={styles.statLabel}>Moves</Text>
                </View>
                    <View style={styles.timeCard}>
                        <Text style={styles.statValue}>{formatTime(time)}</Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>
                </View>

                <View style={[styles.board, {width: boardSize, height: boardSize, padding: gap / 2}]}>
                    {pieces.map((piece, index) => (
                        <Pressable key={index} style={[styles.piece, {width: pieceSize, height: pieceSize, margin: gap / 2}, piece.value === null && styles.emptyPiece]} onPress={() => handlePiecePress(index)} disabled={piece.value === null}>
                            {piece.value !== null && (<Text style={[styles.pieceText, {fontSize: pieceSize / 2.5}]}>{piece.value}</Text>)}
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.controlsRow}><Pressable style={[styles.controlButton, styles.restartButton]} onPress={handleRestartRequest}><Feather name="refresh-cw" size={20} color="#FFF" /><Text style={styles.controlButtonText}>Restart</Text></Pressable><Pressable style={[styles.controlButton, styles.backButton]} onPress={handleBackRequest}><Feather name="arrow-left-circle" size={20} color="#FFF" /><Text style={styles.controlButtonText}>Back</Text></Pressable></View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 15, fontSize: 16, color: COLORS.textLight },
    header: { paddingTop: 20, alignItems: 'center', width: '100%' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
    mainContent: { flex: 1, alignItems: 'center', width: '100%', marginTop: 25 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: BOARD_MARGIN, marginBottom: 20 },
    moveCard: { backgroundColor: COLORS.card, flex: 1, marginRight: 10, paddingVertical: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 4 },
    timeCard: { backgroundColor: COLORS.card, flex: 1, marginLeft: 10, paddingVertical: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 4 },
    statValue: { fontSize: 25, fontWeight: 'bold', color: COLORS.text },
    statLabel: { fontSize: 16, color: COLORS.textLight, marginTop: 4 },
    board: { backgroundColor: COLORS.board, borderRadius: 12, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' },
    piece: { backgroundColor: COLORS.piece, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    emptyPiece: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
    pieceText: { fontWeight: 'bold', color: COLORS.pieceText },
    footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: BOARD_MARGIN, paddingBottom: 20 },
    infoCard: { width: '90%', backgroundColor: COLORS.card, borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 4 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginBottom: 5 },
    infoLabel: { fontSize: 18, color: COLORS.textLight },
    infoValue: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    controlsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    controlButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    restartButton: { backgroundColor: COLORS.primary, marginRight: 10 },
    backButton: { backgroundColor: COLORS.danger, marginLeft: 10 },
    controlButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: COLORS.card, borderRadius: 15, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, marginTop: 10 },
    modalMessage: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 25 },
    modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalButtonCancel: { backgroundColor: COLORS.background, marginRight: 10 },
    modalButtonConfirm: { backgroundColor: COLORS.primary, marginLeft: 10 },
    modalButtonTextCancel: { color: COLORS.text, fontWeight: 'bold' },
    modalButtonTextConfirm: { color: '#FFF', fontWeight: 'bold' },
    winStats: { marginBottom: 20, alignItems: 'center' },
    winStatText: { fontSize: 16, color: COLORS.text, marginVertical: 2 },
});
