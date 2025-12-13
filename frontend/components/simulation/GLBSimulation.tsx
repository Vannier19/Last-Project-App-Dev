import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRACK_WIDTH = SCREEN_WIDTH - 64; // Padding

export function GLBSimulation() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';

    const [velocity, setVelocity] = useState('10'); // m/s (pixels per 100ms for demo)
    const [isPlaying, setIsPlaying] = useState(false);

    // Animation Values
    const position = useSharedValue(0);

    const startSimulation = () => {
        if (isPlaying) {
            // Pause
            cancelAnimation(position);
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        const v = parseFloat(velocity) || 10;
        const duration = ((TRACK_WIDTH - position.value) / v) * 100; // rough time calc

        position.value = withTiming(TRACK_WIDTH, {
            duration: duration * 10,
            easing: Easing.linear
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
        cancelAnimation(position);
        position.value = 0;
        setIsPlaying(false);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: position.value }],
        };
    });

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
    },
    trackContainer: {
        height: 180,
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
