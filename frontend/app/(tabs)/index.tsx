import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { GLBSimulation } from '@/components/simulation/GLBSimulation';
import { GLBBSimulation } from '@/components/simulation/GLBBSimulation';
import { VerticalMotionSimulation } from '@/components/simulation/VerticalMotionSimulation';
import { ProjectileMotionSimulation } from '@/components/simulation/ProjectileMotionSimulation';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Dashboard Menu Item Component
const MenuItem = ({ title, subtitle, icon, onPress, isDark }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.menuItem, isDark && styles.menuItemDark]}>
    <View style={styles.iconContainer}>
      <IconSymbol name={icon} size={32} color={isDark ? Colors.dark.tint : Colors.light.tint} />
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={[styles.menuTitle, isDark && styles.textDark]}>{title}</Text>
      <Text style={[styles.menuSubtitle, isDark && styles.textSecondaryDark]}>{subtitle}</Text>
    </View>
    <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#999'} />
  </TouchableOpacity>
);

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'glb' | 'glbb' | 'vertical' | 'parabola'>('dashboard');

  const renderDashboard = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Virtual Lab</Text>
        <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>Select a simulation to start</Text>
      </View>

      <View style={styles.menuGrid}>
        <MenuItem
          title="GLB"
          subtitle="Uniform Linear Motion"
          icon="speedometer"
          onPress={() => setCurrentScreen('glb')}
          isDark={isDark}
        />
        {/* Placeholders for other topics */}
        <MenuItem
          title="GLBB"
          subtitle="Accelerated Motion"
          icon="bolt.car"
          onPress={() => setCurrentScreen('glbb')}
          isDark={isDark}
        />
        <MenuItem
          title="Vertical"
          subtitle="Free Fall & Upward"
          icon="arrow.up.circle"
          onPress={() => setCurrentScreen('vertical')}
          isDark={isDark}
        />
        <MenuItem
          title="Parabola"
          subtitle="Projectile Motion"
          icon="trajectory"
          onPress={() => setCurrentScreen('parabola')}
          isDark={isDark}
        />
      </View>
    </ScrollView>
  );

  const renderSimulation = () => {
    let SimulationComponent;
    let title = "";
    let subtitle = "";
    let desc = "";

    switch (currentScreen) {
      case 'glb':
        SimulationComponent = <GLBSimulation />;
        title = "GLB Simulation";
        subtitle = "Gerak Lurus Beraturan";
        desc = "In this simulation, objects move with constant velocity (v). The formula used is s = v * t.";
        break;
      case 'glbb':
        SimulationComponent = <GLBBSimulation />;
        title = "GLBB Simulation";
        subtitle = "Gerak Lurus Berubah Beraturan";
        desc = "In this simulation, objects accelerate (a). The formula is s = v₀t + ½at².";
        break;
      case 'vertical':
        SimulationComponent = <VerticalMotionSimulation />;
        title = "Vertical Motion";
        subtitle = "Gerak Vertikal";
        desc = "Free fall or upward throw. Gravity (g=9.8) affects the object.";
        break;
      case 'parabola':
        SimulationComponent = <ProjectileMotionSimulation />;
        title = "Projectile Motion";
        subtitle = "Gerak Parabola";
        desc = "Motion in 2D with projectile trajectory. x = v₀cos(θ)t, y = v₀sin(θ)t - ½gt².";
        break;
      default:
        return null;
    }

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.backText, { color: Colors[colorScheme ?? 'light'].tint }]}>Back to Menu</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.textDark]}>{title}</Text>
            <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>
              {subtitle}
            </Text>
          </View>

          {SimulationComponent}

          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, isDark && styles.textDark]}>Description</Text>
            <Text style={[styles.infoText, isDark && styles.textSecondaryDark]}>
              {desc}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {currentScreen === 'dashboard' ? renderDashboard() : renderSimulation()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  containerDark: {
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 5,
  },
  textDark: {
    color: Colors.dark.text,
  },
  textSecondaryDark: {
    color: Colors.dark.icon,
  },
  menuGrid: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    // Neumorphism Shadow
    shadowColor: Colors.light.border,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItemDark: {
    backgroundColor: Colors.dark.card,
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)', // Light tint bg
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  }
});
