import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { GLBSimulation } from '@/components/simulation/GLBSimulation';
import { GLBBSimulation } from '@/components/simulation/GLBBSimulation';
import { VerticalMotionSimulation } from '@/components/simulation/VerticalMotionSimulation';
import { ProjectileMotionSimulation } from '@/components/simulation/ProjectileMotionSimulation';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HoverableCard } from '@/components/ui/HoverableCard';

// Simulation data
const simulations = [
  {
    key: 'glb',
    title: 'GLB Simulation',
    subtitle: 'Uniform Linear Motion',
    description: 'Explore motion with constant velocity. Objects move in a straight line without acceleration.',
    icon: 'speedometer',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    key: 'glbb',
    title: 'GLBB Simulation',
    subtitle: 'Accelerated Motion',
    description: 'Study motion with constant acceleration. See how velocity changes over time.',
    icon: 'bolt.car',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  {
    key: 'vertical',
    title: 'Vertical Motion',
    subtitle: 'Free Fall & Upward Throw',
    description: 'Explore vertical motion with gravity. Watch objects rise and fall.',
    icon: 'arrow.up.circle',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
  {
    key: 'parabola',
    title: 'Projectile Motion',
    subtitle: 'Parabolic Trajectory',
    description: 'Combine horizontal and vertical motion. Adjust angle and velocity.',
    icon: 'scope',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
];

// Feature Card Component - matching Home style
const FeatureCard = ({ sim, isDark, isWide, onPress }: any) => (
  <HoverableCard
    style={[styles.featureCard, isDark && styles.featureCardDark, isWide && styles.featureCardWide]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: sim.bgColor }]}>
      <IconSymbol name={sim.icon} size={isWide ? 40 : 32} color={sim.color} />
    </View>
    <Text style={[styles.featureTitle, isDark && styles.textDark, isWide && styles.featureTitleWide]}>
      {sim.title}
    </Text>
    <Text style={[styles.featureDesc, isDark && styles.textSecondaryDark, isWide && styles.featureDescWide]}>
      {sim.description}
    </Text>
    <View style={styles.cardArrow}>
      <IconSymbol name="chevron.right" size={20} color={isDark ? '#888' : '#999'} />
    </View>
  </HoverableCard>
);

interface HomeScreenProps {
  requestedSimulation?: string | null;
}

export default function HomeScreen({ requestedSimulation }: HomeScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'glb' | 'glbb' | 'vertical' | 'parabola'>('dashboard');

  // React to requestedSimulation changes
  React.useEffect(() => {
    if (requestedSimulation) {
      setCurrentScreen(requestedSimulation as any);
    }
  }, [requestedSimulation]);

  const renderDashboard = () => (
    <ScrollView contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}>
      {/* Header Section - matching Home */}
      <View style={[styles.headerSection, isDark && styles.headerSectionDark]}>
        <Text style={[styles.title, isDark && styles.textDark, isWide && styles.titleWide]}>
          Virtual Lab
        </Text>
        <Text style={[styles.subtitle, isDark && styles.textSecondaryDark, isWide && styles.subtitleWide]}>
          Experience physics concepts through interactive simulations. Select a topic to start experimenting.
        </Text>
      </View>

      {/* Cards Grid - matching Home */}
      <View style={[styles.cardsGrid, isWide && styles.cardsGridWide]}>
        {simulations.map((sim) => (
          <FeatureCard
            key={sim.key}
            sim={sim}
            isDark={isDark}
            isWide={isWide}
            onPress={() => setCurrentScreen(sim.key as any)}
          />
        ))}
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

          <View style={styles.headerSection}>
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
    paddingBottom: 100,
  },
  scrollContentWide: {
    padding: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Header - matching Home
  headerSection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerSectionDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 34,
  },
  titleWide: {
    fontSize: 36,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    lineHeight: 24,
  },
  subtitleWide: {
    fontSize: 20,
    lineHeight: 30,
  },
  textDark: {
    color: Colors.dark.text,
  },
  textSecondaryDark: {
    color: Colors.dark.icon,
  },
  // Cards Grid - matching Home
  cardsGrid: {
    gap: 20,
  },
  cardsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  // Feature Card - matching Home
  featureCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    // Enhanced Neumorphism shadows
    shadowColor: '#a3b1c6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  featureCardDark: {
    backgroundColor: Colors.dark.card,
    shadowColor: '#000',
    shadowOpacity: 0.5,
  },
  featureCardWide: {
    flex: 1,
    minWidth: 300,
    maxWidth: '48%',
    padding: 32,
  },
  // Icon Container - matching Home
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Feature Title - matching Home
  featureTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  featureTitleWide: {
    fontSize: 22,
  },
  // Feature Description - matching Home
  featureDesc: {
    fontSize: 15,
    color: Colors.light.icon,
    lineHeight: 22,
    paddingRight: 30,
  },
  featureDescWide: {
    fontSize: 17,
    lineHeight: 26,
  },
  // Card Arrow - matching Home
  cardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  },
  // Back button
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
  // Info container for simulation details
  infoContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    shadowColor: '#a3b1c6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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

