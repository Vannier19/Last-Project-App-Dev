import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { AnalysisPanel } from './AnalysisPanel';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation, useDerivedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { api } from '@/services/api';

const SIMULATION_CONFIG = {
    // Initial velocity
    INITIAL_VELOCITY: '20',

    // Initial angle
    INITIAL_ANGLE: '45',

    // Gravity
    GRAVITY: 9.8,

    // Scale: 1 meter = how many pixels
    METER_TO_PIXEL: 5,

    // Red vertical axis (Y-axis at left edge)
    RED_AXIS_LEFT: 35,

    // Blue horizontal axis (X-axis at ground level)
    BLUE_AXIS_BOTTOM: 20,

    // Axis line colors
    RED_AXIS_COLOR: '#EF4444',
    BLUE_AXIS_COLOR: '#3B82F6',
};

export function ProjectileMotionSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const [velocity, setVelocity] = useState(SIMULATION_CONFIG.INITIAL_VELOCITY);
    const [angle, setAngle] = useState(SIMULATION_CONFIG.INITIAL_ANGLE);
    const [isPlaying, setIsPlaying] = useState(false);

    const { GRAVITY, METER_TO_PIXEL } = SIMULATION_CONFIG;

    // Shared Values
    const time = useSharedValue(0);
    const v0 = useDerivedValue(() => parseFloat(velocity) || 0);
    const theta = useDerivedValue(() => parseFloat(angle) || 0);

    // Derived Physics
    const v0x = useDerivedValue(() => {
        const rad = (theta.value * Math.PI) / 180;
        return v0.value * Math.cos(rad);
    });
    const v0y = useDerivedValue(() => {
        const rad = (theta.value * Math.PI) / 180;
        return v0.value * Math.sin(rad);
    });

    const posX = useDerivedValue(() => {
        return v0x.value * time.value;
    });

    const posY = useDerivedValue(() => {
        const y = v0y.value * time.value - 0.5 * GRAVITY * time.value * time.value;
        return Math.max(0, y);
    });

    const velX = useDerivedValue(() => isPlaying ? v0x.value : 0);
    const velY = useDerivedValue(() => {
        if (!isPlaying && time.value === 0) return v0y.value;
        return v0y.value - GRAVITY * time.value;
    });

    const startSimulation = () => {
        if (isPlaying) {
            cancelAnimation(time);
            setIsPlaying(false);
            return;
        }

        const v0_num = parseFloat(velocity) || 0;
        if (v0_num <= 0) return;

        setIsPlaying(true);

        const v0y_num = v0_num * Math.sin((parseFloat(angle) * Math.PI) / 180);
        const totalTime = (2 * v0y_num) / GRAVITY;

        if (time.value >= totalTime) {
            time.value = 0;
        }

        const remainingTime = totalTime - time.value;
        const duration_ms = remainingTime * 1000;

        time.value = withTiming(totalTime, {
            duration: duration_ms,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                runOnJS(handleFinish)();
            }
        });
    };

    const handleFinish = async () => {
        setIsPlaying(false);

        // Build simulation parameters for backend storage
        const simulationParameters = {
            initialVelocity: parseFloat(velocity) || 0,
            angle: parseFloat(angle) || 0,
            maxHeight: Math.max(0, posY.value),
            distance: posX.value,
            time: time.value,
        };

        // Save to Firestore with parameters
        try {
            await api.updateLabStatus('parabola-lab', 'completed', simulationParameters);
            console.log('✅ Projectile simulation saved to Firestore');
        } catch (error) {
            console.log('Failed to save simulation to backend:', error);
        }
    };

    const resetSimulation = () => {
        cancelAnimation(time);
        time.value = 0;
        setIsPlaying(false);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: posX.value * METER_TO_PIXEL },
                { translateY: -posY.value * METER_TO_PIXEL }
            ],
        };
    });

    // Grid component - percentage-based positioning (matching GLB style)
    const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    const Grid = () => (
        <View style={[StyleSheet.absoluteFill, styles.gridContainer]} pointerEvents="none">
            {/* Vertical Lines (every 10%) */}
            {[...Array(11)].map((_, i) => (
                <View
                    key={`v-${i}`}
                    style={[styles.gridLineVertical, { left: `${i * 10}%`, backgroundColor: gridColor }]}
                />
            ))}
            {/* Horizontal Lines (every 20%) */}
            {[...Array(6)].map((_, i) => (
                <View
                    key={`h-${i}`}
                    style={[styles.gridLineHorizontal, { top: `${i * 20}%`, backgroundColor: gridColor }]}
                />
            ))}
        </View>
    );


    const StartPositionLines = () => (
        <>
            {/* Red vertical line (Y-axis at left edge) */}
            <View style={[styles.startLineVertical, { left: SIMULATION_CONFIG.RED_AXIS_LEFT, backgroundColor: SIMULATION_CONFIG.RED_AXIS_COLOR }]} />
            {/* Blue horizontal line (X-axis at ground level) */}
            <View style={[styles.startLineHorizontal, { bottom: SIMULATION_CONFIG.BLUE_AXIS_BOTTOM, backgroundColor: SIMULATION_CONFIG.BLUE_AXIS_COLOR }]} />
        </>
    );

    // Desktop: Side-by-side layout
    if (isWide) {
        return (
            <View style={styles.wideContainer}>
                {/* Left Panel - Controls & Analysis */}
                <View style={[styles.leftPanel, { height: 500 }]}>
                    <AnalysisPanel
                        time={time}
                        posX={posX}
                        posY={posY}
                        velX={velX}
                        velY={velY}
                        forcedMode="dark"
                        style={{
                            flex: 1,
                            marginTop: 0,
                            borderWidth: 2,
                            borderColor: '#64748B', // Slate-500
                            borderRadius: 20,
                            backgroundColor: '#475569', // Slate-600
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    />

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
                            <View style={styles.inputsRowWide}>
                                <Input
                                    containerStyle={styles.inputFlex}
                                    label="v₀ [m/s]"
                                    keyboardType="numeric"
                                    value={velocity}
                                    onChangeText={setVelocity}
                                    editable={!isPlaying}
                                    labelStyle={{ color: '#E2E8F0' }}
                                    style={{ color: '#FFFFFF', backgroundColor: '#64748B', borderColor: '#94A3B8' }}
                                />
                                <Input
                                    containerStyle={styles.inputFlex}
                                    label="θ [deg]"
                                    keyboardType="numeric"
                                    value={angle}
                                    onChangeText={setAngle}
                                    editable={!isPlaying}
                                    labelStyle={{ color: '#E2E8F0' }}
                                    style={{ color: '#FFFFFF', backgroundColor: '#64748B', borderColor: '#94A3B8' }}
                                />
                            </View>
                        </View>

                        <View style={styles.controlsRowWide}>
                            <Button
                                title={isPlaying ? "Pause" : "Fire"}
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
                        <View style={styles.ground} />
                        <Animated.View style={[styles.object, animatedStyle]}>
                            <Image
                                source={require('@/assets/images/parabola.png')}
                                style={styles.objImage}
                                contentFit="contain"
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
        );
    }

    // Mobile: Stacked layout (original)
    return (
        <View style={styles.container}>
            <Card style={styles.controlPanel}>
                <View style={styles.inputsRow}>
                    <Input
                        containerStyle={styles.inputFlex}
                        label="Velocity (v0) [m/s]"
                        keyboardType="numeric"
                        value={velocity}
                        onChangeText={setVelocity}
                        editable={!isPlaying}
                    />
                    <Input
                        containerStyle={styles.inputFlex}
                        label="Angle (θ) [deg]"
                        keyboardType="numeric"
                        value={angle}
                        onChangeText={setAngle}
                        editable={!isPlaying}
                    />
                </View>

                <View style={styles.controls}>
                    <Button
                        title={isPlaying ? "Pause" : "Fire"}
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
                <StartPositionLines />
                <View style={styles.ground} />

                <Animated.View style={[styles.object, animatedStyle]}>
                    <Image
                        source={require('@/assets/images/parabola.png')}
                        style={styles.objImage}
                        contentFit="contain"
                    />
                </Animated.View>
            </View>

            <AnalysisPanel
                time={time}
                posX={posX}
                posY={posY}
                velX={velX}
                velY={velY}
            />
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
    inputsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputFlex: {
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        marginTop: 4,
    },
    trackContainer: {
        height: 250,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'flex-end',
        paddingLeft: 20,
        paddingBottom: 20,
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
    inputsRowWide: {
        flexDirection: 'row',
        gap: 12,
    },
    controlsRowWide: {
        flexDirection: 'row',
        marginTop: 16,
    },
    controlsWide: {
        marginTop: 20,
    },
    trackContainerWide: {
        height: 400,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'flex-end',
        paddingLeft: 20,
        paddingBottom: 20,
        overflow: 'hidden',
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Common
    ground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        backgroundColor: '#48bb78',
    },
    object: {
        width: 30,
        height: 30,
        zIndex: 2,
    },
    objImage: {
        width: '100%',
        height: '100%',
    },
    // Grid Styles
    gridContainer: {
        zIndex: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
    },
    // Start Position Indicator Styles
    startLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        zIndex: 1,
    },
    startLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        zIndex: 1,
    },
});
