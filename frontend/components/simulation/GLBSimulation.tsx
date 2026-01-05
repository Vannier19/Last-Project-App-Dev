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

const SIMULATION_CONFIG = {
    // Scale: 1 meter = how many pixels
    PIXELS_PER_METER: 10,

    // Maximum distance to display
    MAX_DISTANCE: 100,

    // Car initial position
    CAR_START_X: 45,

    // Red vertical axis (Y-axis) position from left edge
    RED_AXIS_LEFT: 75,

    // Blue horizontal axis (X-axis) position from top
    BLUE_AXIS_TOP: '50%' as const,

    // Axis line colors
    RED_AXIS_COLOR: '#EF4444',
    BLUE_AXIS_COLOR: '#3B82F6',
};

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
    const [currentTime, setCurrentTime] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);

    const position = useSharedValue(SIMULATION_CONFIG.CAR_START_X);

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

        // Build simulation parameters for backend storage
        const simulationParameters = {
            velocity: parseFloat(velocity) || 10,
            distance: currentPosition,
            time: currentTime,
        };

        // Mark lab as completed with parameters (saved to Firestore)
        try {
            await api.updateLabStatus('glb-lab', 'completed', simulationParameters);
            console.log('✅ GLB simulation saved to Firestore');
        } catch (error) {
            console.log('Failed to save simulation to backend:', error);
        }

        // After 3 successful runs, show completion alert
        if (newCompletedRuns >= 3) {
            Alert.alert(
                'Lab Completed! 🎉',
                'You have successfully completed the GLB simulation lab.',
                [{ text: 'OK' }]
            );
        }
    };

    const resetSimulation = () => {
        cancelAnimation(position);
        position.value = SIMULATION_CONFIG.CAR_START_X;
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentPosition(0);
    };

    // Real-time position tracking
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isPlaying) {
            const startTime = Date.now();
            const startPos = currentPosition;
            interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const v = parseFloat(velocity) || 10;
                const newPos = startPos + v * elapsed;
                setCurrentTime(currentTime + elapsed);
                setCurrentPosition(Math.min(newPos, TRACK_WIDTH));
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: position.value }],
        };
    });

    const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

    const Grid = () => (
        <View style={[StyleSheet.absoluteFill, styles.gridContainer]} pointerEvents="none">
            {/* Vertical Lines (every 10%) */}
            {[...Array(11)].map((_, i) => (
                <View
                    key={`v-${i}`}
                    style={[
                        styles.gridLineVertical,
                        { left: `${i * 10}%`, backgroundColor: gridColor }
                    ]}
                />
            ))}
            {/* Horizontal Lines (every 20%) */}
            {[...Array(6)].map((_, i) => (
                <View
                    key={`h-${i}`}
                    style={[
                        styles.gridLineHorizontal,
                        { top: `${i * 20}%`, backgroundColor: gridColor }
                    ]}
                />
            ))}
        </View>
    );

    // Start Position Indicator Lines (Red vertical, Blue horizontal with tick marks)
    const StartPositionLines = () => (
        <>
            {/* Red vertical line (Y-axis) */}
            <View style={[
                styles.startLineVertical,
                { left: SIMULATION_CONFIG.RED_AXIS_LEFT, backgroundColor: SIMULATION_CONFIG.RED_AXIS_COLOR }
            ]} />
            {/* Blue horizontal line (X-axis) with tick marks */}
            <View style={[
                styles.startLineHorizontal,
                { top: SIMULATION_CONFIG.BLUE_AXIS_TOP, backgroundColor: SIMULATION_CONFIG.BLUE_AXIS_COLOR }
            ]}>
                {/* Tick marks on the blue axis line */}
                {[0, 25, 50, 75, 100].map((percent) => (
                    <View
                        key={percent}
                        style={[
                            styles.axisTick,
                            { left: `${percent}%` }
                        ]}
                    />
                ))}
            </View>
        </>
    );

    // Desktop: Side-by-side layout
    if (isWide) {
        return (
            <View style={styles.wideContainer}>
                {/* Left Panel - Controls & Info */}
                <View style={[styles.leftPanel, { height: 500 }]}>
                    <Card style={[
                        styles.infoCard,
                        {
                            flex: 1,
                            borderWidth: 2,
                            borderColor: '#64748B', // Slate-500
                            borderRadius: 20,
                            justifyContent: 'center',
                            backgroundColor: '#475569', // Slate-600
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Real-time Values</Text>
                        <Text style={[styles.infoText, { color: '#E2E8F0' }]}>
                            Velocity: {velocity} m/s (constant)
                        </Text>
                        <Text style={[styles.infoText, { color: '#E2E8F0' }]}>
                            Position: {currentPosition.toFixed(1)} m
                        </Text>
                        <Text style={[styles.infoText, { color: '#E2E8F0' }]}>
                            Time: {currentTime.toFixed(1)} s
                        </Text>
                        <Text style={[styles.infoText, { color: '#94A3B8', fontSize: 12, marginTop: 8 }]}>
                            Formula: s = v × t
                        </Text>
                    </Card>

                    <Card style={[
                        styles.controlPanelWide,
                        {
                            flex: 1,
                            borderWidth: 2,
                            borderColor: '#64748B', // Slate-500
                            borderRadius: 20,
                            justifyContent: 'space-between',
                            padding: 24,
                            backgroundColor: '#475569', // Slate-600
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}>
                        <View style={{ gap: 16 }}>
                            <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Parameters</Text>
                            <Input
                                label="Velocity (v) [m/s]"
                                keyboardType="numeric"
                                value={velocity}
                                onChangeText={setVelocity}
                                editable={!isPlaying}
                                labelStyle={{ color: '#E2E8F0' }}
                                style={{ color: '#FFFFFF', backgroundColor: '#64748B', borderColor: '#94A3B8' }}
                            />
                        </View>

                        <View style={styles.controlsRowWide}>
                            <Button
                                title={isPlaying ? "Pause" : "Start"}
                                onPress={startSimulation}
                                style={{ flex: 1, marginRight: 12, minHeight: 48 }}
                            />
                            <Button
                                title="Reset"
                                variant="secondary"
                                onPress={resetSimulation}
                                style={{ flex: 1, minHeight: 48, backgroundColor: '#64748B', borderWidth: 0 }}
                                textStyle={{ color: '#FFFFFF' }}
                            />
                        </View>
                    </Card>
                </View>

                {/* Right Panel - Simulation Area */}
                <View style={styles.rightPanel}>
                    <View style={[
                        styles.trackContainerWide,
                        isDark && styles.trackContainerDark,
                        {
                            height: 500,
                            borderWidth: 2,
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#9DA4B0',
                            borderRadius: 20,
                            backgroundColor: isDark ? '#334155' : '#FFFFFF', // Slate-700 for dark mode
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.3 : 0.15,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}>
                        <Grid />
                        <StartPositionLines />
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
                <Grid />
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
        backgroundColor: '#334155', // Slate-700 - medium dark gray
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
        paddingHorizontal: 0,
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
        left: 24, // Match paddingHorizontal of container - aligns 0m with car start
        right: 24,
        height: 30, // Fixed height for the ruler container
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
    },
    gridContainer: {
        zIndex: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.1)', // Match GLBB grid style
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    gridLineDark: {
        backgroundColor: 'rgba(255,255,255,0.15)', // Match GLBB grid style
    },
    // Start Position Indicator Styles
    startLineVertical: {
        position: 'absolute',
        left: 30, // Match paddingHorizontal of container - where car actually starts
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#EF4444', // Red for Y-axis
        zIndex: 1,
    },
    startLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        height: 2,
        backgroundColor: '#3B82F6', // Blue for X-axis
        zIndex: 1,
    },
    startLineDark: {
        // Colors are visible enough for dark mode
    },
    // Tick marks on the axis line
    axisTick: {
        position: 'absolute',
        top: -8,
        width: 2,
        height: 18,
        backgroundColor: '#3B82F6',
        marginLeft: -1,
    },
});
