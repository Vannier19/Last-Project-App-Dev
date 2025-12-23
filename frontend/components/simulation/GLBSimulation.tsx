import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

export function GLBSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const TRACK_WIDTH = isWide ? width * 0.5 : width - 64;

    const [velocity, setVelocity] = useState('10');
    const [isPlaying, setIsPlaying] = useState(false);
    const [completedRuns, setCompletedRuns] = useState(0);

    const position = useSharedValue(0);

    // Mark lab as in-progress on first interaction
    useEffect(() => {
        const markInProgress = async () => {
            try {
                await api.updateLabStatus('glb-lab', 'in-progress');
                console.log('✅ GLB Lab marked as in-progress');
            } catch (error) {
                console.log('Failed to mark lab progress:', error);
            }
        };
        
        markInProgress();
    }, []); // Run once on mount

    const startSimulation = () => {
        if (isPlaying) {
            cancelAnimation(position);
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        const v = parseFloat(velocity) || 10;
        const duration = ((TRACK_WIDTH - position.value) / v) * 100;

        position.value = withTiming(TRACK_WIDTH, {
            duration: duration * 10,
            easing: Easing.linear
        }, (finished) => {
            if (finished) {
                runOnJS(handleFinish)();
            }
        });
    };

    const handleFinish = async () => {
        setIsPlaying(false);
        const newCompletedRuns = completedRuns + 1;
        setCompletedRuns(newCompletedRuns);

        // After 3 successful runs, mark lab as completed
        if (newCompletedRuns >= 3) {
            try {
                await api.updateLabStatus('glb-lab', 'completed');
                Alert.alert(
                    'Lab Completed! 🎉',
                    'You have successfully completed the GLB simulation lab.',
                    [{ text: 'OK' }]
                );
                console.log('✅ GLB Lab marked as completed');
            } catch (error) {
                console.log('Failed to save lab completion:', error);
            }
        }
    };

    const resetSimulation = () => {
        cancelAnimation(position);
        position.value = 0;
        setIsPlaying(false);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: position.value }],
        };
    });

    // Ruler component
    const Ruler = () => (
        <View style={styles.ruler}>
            {[0, 25, 50, 75, 100].map((tick) => (
                <View key={tick} style={styles.tickContainer}>
                    <View style={[styles.tick, isDark && styles.tickDark]} />
                    <Text style={[styles.tickLabel, isDark && styles.textDark]}>{tick}%</Text>
                </View>
            ))}
        </View>
    );

    // Desktop: Side-by-side layout
    if (isWide) {
        return (
            <View style={styles.wideContainer}>
                {/* Left Panel - Controls */}
                <View style={styles.leftPanel}>
                    <Card style={styles.controlPanelWide}>
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Parameters</Text>
                        <Input
                            label="Velocity (v) [m/s]"
                            keyboardType="numeric"
                            value={velocity}
                            onChangeText={setVelocity}
                            editable={!isPlaying}
                        />

                        <View style={styles.controlsRowWide}>
                            <Button
                                title={isPlaying ? "Pause" : "Start"}
                                onPress={startSimulation}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Reset"
                                variant="secondary"
                                onPress={resetSimulation}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </Card>

                    <Card style={styles.infoCard}>
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Real-time Values</Text>
                        <Text style={[styles.infoText, isDark && styles.textSecondaryDark]}>
                            Velocity: {velocity} m/s (constant)
                        </Text>
                        <Text style={[styles.infoText, isDark && styles.textSecondaryDark]}>
                            Formula: s = v × t
                        </Text>
                    </Card>
                </View>

                {/* Right Panel - Simulation Area */}
                <View style={styles.rightPanel}>
                    <View style={[styles.trackContainerWide, isDark && styles.trackContainerDark]}>
                        <Ruler />
                        <Animated.View style={[styles.object, animatedStyle]}>
                            <Image
                                source={require('@/assets/images/car.png')}
                                style={styles.carImage}
                                contentFit="contain"
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
        );
    }

    // Mobile: Stacked layout
    return (
        <View style={styles.container}>
            <Card style={styles.controlPanel}>
                <Input
                    label="Velocity (v) [m/s]"
                    keyboardType="numeric"
                    value={velocity}
                    onChangeText={setVelocity}
                    editable={!isPlaying}
                />
                <View style={styles.controls}>
                    <Button
                        title={isPlaying ? "Pause" : "Start"}
                        onPress={startSimulation}
                        style={{ flex: 1, marginRight: 8 }}
                    />
                    <Button
                        title="Reset"
                        variant="secondary"
                        onPress={resetSimulation}
                        style={{ flex: 1 }}
                    />
                </View>
            </Card>

            <View style={[styles.trackContainer, isDark && styles.trackContainerDark]}>
                <Ruler />
                <Animated.View style={[styles.object, animatedStyle]}>
                    <Image
                        source={require('@/assets/images/car.png')}
                        style={styles.carImage}
                        contentFit="contain"
                    />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Mobile Layout
    container: {
        gap: 20,
    },
    controlPanel: {
        marginBottom: 8,
    },
    controls: {
        flexDirection: 'row',
    },
    trackContainer: {
        height: 180,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 16,
        overflow: 'hidden',
        shadowColor: Colors.light.border,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    trackContainerDark: {
        backgroundColor: Colors.dark.background,
    },
    // Desktop Layout
    wideContainer: {
        flexDirection: 'row',
        gap: 24,
    },
    leftPanel: {
        width: 320,
        gap: 20,
    },
    rightPanel: {
        flex: 1,
    },
    controlPanelWide: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 16,
    },
    textDark: {
        color: Colors.dark.text,
    },
    textSecondaryDark: {
        color: Colors.dark.icon,
    },
    controlsRowWide: {
        flexDirection: 'row',
        marginTop: 16,
    },
    controlsWide: {
        marginTop: 20,
    },
    infoCard: {
        padding: 20,
    },
    infoText: {
        fontSize: 14,
        color: Colors.light.icon,
        lineHeight: 22,
    },
    trackContainerWide: {
        height: 300,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 24,
        overflow: 'hidden',
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Common
    ruler: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    tickContainer: {
        alignItems: 'center',
    },
    tick: {
        width: 2,
        height: 12,
        backgroundColor: Colors.light.icon,
        marginBottom: 4,
        borderRadius: 1,
    },
    tickDark: {
        backgroundColor: Colors.dark.icon,
    },
    tickLabel: {
        fontSize: 10,
        color: Colors.light.icon,
        fontWeight: '600',
    },
    object: {
        width: 60,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    carImage: {
        width: '100%',
        height: '100%',
    }
});
