import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '../../theme';
import { FaHouse, FaChartSimple, FaUser, FaRocket } from "react-icons/fa6";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingTop: 6,
          paddingBottom: bottomPad,
          height: Platform.OS === 'ios' ? 52 + bottomPad : 60 + bottomPad,
        },
        tabBarLabelStyle: typography.caption,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon color={color} label={<FaHouse />}/>,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <TabIcon color={color} label={<FaRocket />} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <TabIcon color={color} label={<FaChartSimple />} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon color={color} label={<FaUser />} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ color, label }) {
  return (
    <Text style={{ color, fontSize: 18, fontWeight: '600', marginBottom: -2 }}>{label}</Text>
  );
}
