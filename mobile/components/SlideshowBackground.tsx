import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const IMAGES = [
    "https://res.cloudinary.com/dd431rll2/image/upload/v1768751651/power-couple-slideshow/childhood-1.jpg",
    "https://res.cloudinary.com/dd431rll2/image/upload/v1768751652/power-couple-slideshow/childhood-2.jpg",
    "https://res.cloudinary.com/dd431rll2/image/upload/v1768751720/power-couple-slideshow/memory-1.jpg",
    "https://res.cloudinary.com/dd431rll2/image/upload/v1768751722/power-couple-slideshow/memory-2.jpg",
    "https://res.cloudinary.com/dd431rll2/image/upload/v1768751723/power-couple-slideshow/memory-3.jpg",
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1920&auto=format&fit=crop"
];

export default function SlideshowBackground() {
    const [index, setIndex] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        // Initial fade in
        Animated.timing(fadeAnim, {
            toValue: 0.6, // Darker opacity for readability
            duration: 2000,
            useNativeDriver: true,
        }).start();

        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
            }).start(() => {
                setIndex((prev) => (prev + 1) % IMAGES.length);
                // Fade back in
                Animated.timing(fadeAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: true,
                }).start();
            });
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={{ uri: IMAGES[index] }}
                style={[styles.image, { opacity: fadeAnim }]}
            />
            <View style={styles.overlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    image: {
        width: width,
        height: height,
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)', // Additional dimming
    },
});
