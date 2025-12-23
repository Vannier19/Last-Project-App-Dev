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

export function ProjectileMotionSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const [velocity, setVelocity] = useState('20');
    const [angle, setAngle] = useState('45');
    const [isPlaying, setIsPlaying] = useState(false);

    const GRAVITY = 9.8;
    const METER_TO_PIXEL = 5;

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

    const handleFinish = () => {
        setIsPlaying(false);
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
                                label="θ [deg]"
                                keyboardType="numeric"
                                value={angle}
                                onChangeText={setAngle}
                                editable={!isPlaying}
                            />
                        </View>

                        <View style={styles.controlsRowWide}>
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
    }
});
