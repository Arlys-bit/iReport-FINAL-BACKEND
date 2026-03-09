import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReportsProvider } from "@/contexts/ReportContext";
import { StaffProvider } from "@/contexts/StaffContext";
import { StudentsProvider } from "@/contexts/StudentsContext";
import { BuildingsProvider } from "@/contexts/BuildingsContext";
import { LiveReportsProvider } from "@/contexts/LiveReportsContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore splash timing errors during app bootstrap.
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="teacher" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {
      // Ignore when splash is already hidden.
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <LiveReportsProvider>
            <BuildingsProvider>
              <StaffProvider>
                <StudentsProvider>
                  <ReportsProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <RootLayoutNav />
                    </GestureHandlerRootView>
                  </ReportsProvider>
                </StudentsProvider>
              </StaffProvider>
            </BuildingsProvider>
          </LiveReportsProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
