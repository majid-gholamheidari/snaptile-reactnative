import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                // This option hides the bottom tab bar
                tabBarStyle: {
                    display: 'none',
                },
            }}
        >
            {/* Main menu screen */}
            <Tabs.Screen
                name="index"
                options={{
                    // This line hides the header for the main menu screen
                    headerShown: false,
                }}
            />

            {/* Profile screen */}
            <Tabs.Screen
                name="profile"
                options={{
                    // This line hides the header for the profile screen
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}
