import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AnalysisPanel } from './AnalysisPanel';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation, useDerivedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function VerticalMotionSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';

    const [velocity, setVelocity] = useState('20'); // Initial Velocity (v0) upward
    const [isPlaying, setIsPlaying] = useState(false);

    // Physics Constants
    const GRAVITY = 9.8;
    const PIXEL_TO_METER = 1 / 5; // 5px = 1m
    const METER_TO_PIXEL = 5;

    // Shared Values
    const time = useSharedValue(0);
    const v0 = useDerivedValue(() => parseFloat(velocity) || 0);

    // Derived Physics Values (Time-Driven)
    const posY = useDerivedValue(() => {
        // y = v0*t - 0.5*g*t^2
        // If y < 0 (below ground), clamp to 0
        const y = v0.value * time.value - 0.5 * GRAVITY * time.value * time.value;
        return Math.max(0, y);
    });

    const velY = useDerivedValue(() => {
        // v = v0 - gt
        if (!isPlaying && time.value === 0) return v0.value;
        return v0.value - GRAVITY * time.value;
    });

    const posX = useDerivedValue(() => 0);
    const velX = useDerivedValue(() => 0);

    const startSimulation = () => {
        if (isPlaying) {
            cancelAnimation(time);
            setIsPlaying(false);
            return;
        }

        const v0_num = parseFloat(velocity) || 0;
        if (v0_num <= 0) return;

        setIsPlaying(true);

        // Total flight time: 2 * v0 / g (up and down to same level)
        const totalTime = (2 * v0_num) / GRAVITY;

        if (time.value >= totalTime) {
            // Restart if finished
            time.value = 0;
        }

        const remainingTime = totalTime - time.value;
        const duration_ms = remainingTime * 1000;

        // Animate Time linearly
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
            transform: [{ translateY: -posY.value * METER_TO_PIXEL }], // Negative because Y goes down in RN
        };
    });

    return (
        <View style={styles.container}>
            <Card style={styles.controlPanel}>
                <Input
                    label="Initial Velocity (v0) [m/s]"
                    keyboardType="numeric"
                    value={velocity}
                    onChangeText={setVelocity}
                    editable={!isPlaying}
                />
                <View style={styles.controls}>
                    <Button
                        title={isPlaying ? "Pause" : "Throw Up"}
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
                <View style={styles.rulerContainer}>
                    {[0, 20, 40, 60, 80, 100].map(h => (
                        <View key={h} style={[styles.rulerMark, { bottom: h * 2 }]} />
                    ))}
                </View>

                <View style={styles.ground} />

                <Animated.View style={[styles.object, animatedStyle]}>
                    <Image
                        source={require('@/assets/images/rock.png')}
                        style={styles.rockImage}
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
    container: {
        gap: 20,
    },
    controlPanel: {
        marginBottom: 8,
    },
    controls: {
        flexDirection: 'row',
        marginTop: 4,
    },
    trackContainer: {
        height: 300,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 20,
        borderWidth: 0,
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
    ground: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 20,
        backgroundColor: '#48bb78',
    },
    rulerContainer: {
        position: 'absolute',
        left: 20,
        bottom: 20,
        height: '100%',
        width: 10,
    },
    rulerMark: {
        position: 'absolute',
        left: 0,
        width: 10,
        height: 2,
        backgroundColor: '#ccc',
    },
    object: {
        width: 40,
        height: 40,
        zIndex: 2,
        marginBottom: 0,
    },
    rockImage: {
        width: '100%',
        height: '100%',
    }
});
