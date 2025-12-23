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

export function GLBBSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const TRACK_WIDTH = isWide ? width * 0.5 : width - 64;
    const TRACK_CONTAINER_HEIGHT = isWide ? 300 : 180;

    const [velocity, setVelocity] = useState('0');
    const [acceleration, setAcceleration] = useState('2');
    const [isPlaying, setIsPlaying] = useState(false);

    const PIXEL_TO_METER = 1 / 20;
    const METER_TO_PIXEL = 20;

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
            transform: [{ translateX: Math.min(translateX.value, TRACK_WIDTH) }]
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
                {/* Left Panel - Controls & Analysis */}
                <View style={styles.leftPanel}>
                    <Card style={styles.controlPanelWide}>
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Parameters</Text>
                        <View style={styles.inputsRowWide}>
                            <Input
                                containerStyle={styles.inputFlex}
                                label="v₀ [m/s]"
                                keyboardType="numeric"
                                value={velocity}
                                onChangeText={setVelocity}
                                editable={!isPlaying}
                            />
                            <Input
                                containerStyle={styles.inputFlex}
                                label="a [m/s²]"
                                keyboardType="numeric"
                                value={acceleration}
                                onChangeText={setAcceleration}
                                editable={!isPlaying}
                            />
                        </View>

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

                    <AnalysisPanel
                        time={time}
                        posX={posX}
                        posY={posY}
                        velX={velX}
                        velY={velY}
                    />
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
                <Ruler />
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
    }
});
