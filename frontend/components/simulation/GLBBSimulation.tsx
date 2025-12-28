import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, useWindowDimensions } from 'react-native';
import { AnalysisPanel } from './AnalysisPanel';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation, useDerivedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ============================================
// SIMULATION CONFIGURATION - Edit values here
// ============================================
const SIMULATION_CONFIG = {
    // Initial velocity [m/s]
    INITIAL_VELOCITY: '0',

    // Initial acceleration [m/s²]
    INITIAL_ACCELERATION: '2',

    // Scale factors
    PIXEL_TO_METER: 1 / 20,
    METER_TO_PIXEL: 20,

    // Car initial position (translateX value) - same as GLB
    CAR_START_X: 25,

    // Red vertical axis (Y-axis) position from left edge - same as GLB
    RED_AXIS_LEFT: 75,

    // Blue horizontal axis (X-axis) position from top (percentage) - same as GLB
    BLUE_AXIS_TOP: '50%' as const,

    // Axis line colors
    RED_AXIS_COLOR: '#EF4444',
    BLUE_AXIS_COLOR: '#3B82F6',
};

export function GLBBSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const TRACK_WIDTH = isWide ? width * 0.5 : width - 64;
    const TRACK_CONTAINER_HEIGHT = isWide ? 300 : 180;

    const [velocity, setVelocity] = useState(SIMULATION_CONFIG.INITIAL_VELOCITY);
    const [acceleration, setAcceleration] = useState(SIMULATION_CONFIG.INITIAL_ACCELERATION);
    const [isPlaying, setIsPlaying] = useState(false);

    const { PIXEL_TO_METER, METER_TO_PIXEL } = SIMULATION_CONFIG;

    const time = useSharedValue(0);
    const v0 = useDerivedValue(() => parseFloat(velocity) || 0);
    const accel = useDerivedValue(() => parseFloat(acceleration) || 0);

    const posX = useDerivedValue(() => {
        return v0.value * time.value + 0.5 * accel.value * time.value * time.value;
    });

    const velX = useDerivedValue(() => {
        if (!isPlaying && time.value === 0) return v0.value;
        return v0.value + accel.value * time.value;
    });
    const posY = useDerivedValue(() => 0);
    const velY = useDerivedValue(() => 0);

    const translateX = useDerivedValue(() => {
        return posX.value * METER_TO_PIXEL;
    });

    const startSimulation = () => {
        if (isPlaying) {
            cancelAnimation(time);
            setIsPlaying(false);
            return;
        }

        const v0_num = parseFloat(velocity) || 0;
        const a_num = parseFloat(acceleration) || 0;

        if (v0_num === 0 && a_num === 0) return;

        setIsPlaying(true);

        const trackMeters = TRACK_WIDTH * PIXEL_TO_METER;
        let targetTime = 0;

        if (a_num === 0) {
            targetTime = trackMeters / v0_num;
        } else {
            const discriminant = v0_num * v0_num - 4 * (0.5 * a_num) * (-trackMeters);
            if (discriminant >= 0) {
                const t1 = (-v0_num + Math.sqrt(discriminant)) / a_num;
                targetTime = t1;
            }
        }

        if (targetTime <= time.value) return;

        const remainingTime = targetTime - time.value;
        const duration_ms = remainingTime * 1000;

        time.value = withTiming(targetTime, {
            duration: duration_ms,
            easing: Easing.linear
        }, (finished) => {
            if (finished) {
                runOnJS(handleFinish)();
            }
        });
    };

    const handleFinish = () => setIsPlaying(false);

    const resetSimulation = () => {
        cancelAnimation(time);
        time.value = 0;
        setIsPlaying(false);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: SIMULATION_CONFIG.CAR_START_X + Math.min(translateX.value, TRACK_WIDTH) }]
        };
    });

    // Grid component - percentage-based positioning (same as GLB)
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

    // Start Position Indicator Lines (Red vertical, Blue horizontal with tick marks)
    const StartPositionLines = () => (
        <>
            {/* Red vertical line (Y-axis) */}
            <View style={[styles.startLineVertical, { left: SIMULATION_CONFIG.RED_AXIS_LEFT, backgroundColor: SIMULATION_CONFIG.RED_AXIS_COLOR }]} />
            {/* Blue horizontal line (X-axis) with tick marks */}
            <View style={[styles.startLineHorizontal, { top: SIMULATION_CONFIG.BLUE_AXIS_TOP, backgroundColor: SIMULATION_CONFIG.BLUE_AXIS_COLOR }]}>
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
                                    label="a [m/s²]"
                                    keyboardType="numeric"
                                    value={acceleration}
                                    onChangeText={setAcceleration}
                                    editable={!isPlaying}
                                    labelStyle={{ color: '#E2E8F0' }}
                                    style={{ color: '#FFFFFF', backgroundColor: '#64748B', borderColor: '#94A3B8' }}
                                />
                            </View>
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
                <View style={styles.inputsRow}>
                    <Input
                        containerStyle={styles.inputFlex}
                        label="Initial Vel (v0) [m/s]"
                        keyboardType="numeric"
                        value={velocity}
                        onChangeText={setVelocity}
                        editable={!isPlaying}
                    />
                    <Input
                        containerStyle={styles.inputFlex}
                        label="Accel (a) [m/s²]"
                        keyboardType="numeric"
                        value={acceleration}
                        onChangeText={setAcceleration}
                        editable={!isPlaying}
                    />
                </View>
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
                <StartPositionLines />
                <Animated.View style={[styles.object, animatedStyle]}>
                    <Image
                        source={require('@/assets/images/car.png')}
                        style={styles.carImage}
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
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    gridLineDark: {
        backgroundColor: 'rgba(255,255,255,0.05)',
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
