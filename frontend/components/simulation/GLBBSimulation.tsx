import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { AnalysisPanel } from './AnalysisPanel';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation, useDerivedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRACK_WIDTH = SCREEN_WIDTH - 64; // Padding
const CONTROL_PANEL_HEIGHT = 200; // Approximate height of control panel to help with scroll
const TRACK_CONTAINER_HEIGHT = 180;

export function GLBBSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';

    const [velocity, setVelocity] = useState('0'); // Initial v0
    const [acceleration, setAcceleration] = useState('2');
    const [isPlaying, setIsPlaying] = useState(false);

    const PIXEL_TO_METER = 1 / 20;
    const METER_TO_PIXEL = 20;

    const time = useSharedValue(0);
    const v0 = useDerivedValue(() => parseFloat(velocity) || 0);
    const accel = useDerivedValue(() => parseFloat(acceleration) || 0);

    const posX = useDerivedValue(() => {
        // x = v0*t + 0.5*a*t^2
        return v0.value * time.value + 0.5 * accel.value * time.value * time.value;
    });

    const velX = useDerivedValue(() => {
        // v = v0 + at
        // Show 0 if not playing and time is 0? Actually physics says v0 is initial vel.
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

        // Safety: if a=0 and v0=0, no move
        if (v0_num === 0 && a_num === 0) return;

        setIsPlaying(true);

        // Calculate time to reach end
        const trackMeters = TRACK_WIDTH * PIXEL_TO_METER;

        let targetTime = 0;
        const currentDist = posX.value;

        const remainingDist = trackMeters - currentDist;

        if (a_num === 0) {
            targetTime = trackMeters / v0_num;
        } else {
            // Use quadratic formula for Total Time to reach End Distance
            // 0.5*a*T^2 + v0*T - Distance = 0
            const discriminant = v0_num * v0_num - 4 * (0.5 * a_num) * (-trackMeters);
            if (discriminant >= 0) {
                const t1 = (-v0_num + Math.sqrt(discriminant)) / a_num;
                targetTime = t1;
            }
        }

        if (targetTime <= time.value) return; // finished

        // Animation duration should match real time for physics accuracy
        const remainingTime = targetTime - time.value;
        const duration_ms = remainingTime * 1000;

        time.value = withTiming(targetTime, {
            duration: duration_ms,
            easing: Easing.linear // Time flows linearly!
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
            // Limit visual translation to track width to avoid car flying off UI?
            // Or allow it to fly off. Legacy checked bounds.
            transform: [{ translateX: Math.min(translateX.value, TRACK_WIDTH) }]
        };
    });

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
                <View style={styles.ruler}>
                    {[0, 25, 50, 75, 100].map((tick) => (
                        <View key={tick} style={styles.tickContainer}>
                            <View style={[styles.tick, isDark && styles.tickDark]} />
                            <Text style={[styles.tickLabel, isDark && styles.textDark]}>{tick}%</Text>
                        </View>
                    ))}
                </View>
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
        height: TRACK_CONTAINER_HEIGHT,
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 0,
        borderColor: 'transparent',
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
    textDark: {
        color: Colors.dark.icon,
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
