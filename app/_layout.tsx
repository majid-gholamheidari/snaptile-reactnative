import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
    const { authState, isAuthLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        const inAuthGroup = segments[0] === 'auth';

        SplashScreen.hideAsync();

        if (authState.authenticated && inAuthGroup) {
            router.replace('/(tabs)');
        } else if (!authState.authenticated && !inAuthGroup) {
            router.replace('/auth');
        }

    }, [authState.authenticated, isAuthLoading, segments]);

    if (isAuthLoading) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="game" />
            <Stack.Screen name="taskGame" />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
