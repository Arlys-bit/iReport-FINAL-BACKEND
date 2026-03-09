import { Stack } from 'expo-router';
import React from 'react';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="report/index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="report/[id]"
        options={{
          title: 'Report Details',
        }}
      />
    </Stack>
  );
}
