import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible automatically until we hide it
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
    const { authState, isAuthLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // Wait until the auth state is fully loaded before doing anything
        if (isAuthLoading) {
            return;
        }

        const inApp = segments[0] === '(tabs)';

        if (authState.authenticated && !inApp) {
            // User is signed in but not in the main app area.
            // Redirect to the home screen.
            router.replace('/(tabs)');
        } else if (!authState.authenticated && inApp) {
            // User is not signed in and is trying to access a protected screen.
            // Redirect to the auth screen.
            router.replace('/auth');
        }

        // Hide the splash screen now that we're done checking.
        SplashScreen.hideAsync();

    }, [authState, isAuthLoading, segments]);

    // Render nothing while the auth state is loading.
    // The splash screen will be visible during this time.
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
