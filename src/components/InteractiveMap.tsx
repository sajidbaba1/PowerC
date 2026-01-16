"use client";

import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, User, Navigation, Satellite, Map as MapIcon, Loader2, Plane } from "lucide-react";

interface InteractiveMapProps {
    onClose: () => void;
    myLocation: { latitude?: number; longitude?: number; name?: string } | null;
    partnerLocation: { latitude?: number; longitude?: number; name?: string } | null;
    distance: number | null;
    myRole: "sajid" | "nasywa";
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "1rem"
};

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e4b6b" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212835" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] }
];

export default function InteractiveMap({ onClose, myLocation, partnerLocation, distance, myRole }: InteractiveMapProps) {
    const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
    const [selectedMarker, setSelectedMarker] = useState<"me" | "partner" | null>(null);
    const [showHugAnimation, setShowHugAnimation] = useState(false);
    const [hugProgress, setHugProgress] = useState(0);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const myCoords = myLocation?.latitude && myLocation?.longitude
        ? { lat: myLocation.latitude, lng: myLocation.longitude }
        : null;

    const partnerCoords = partnerLocation?.latitude && partnerLocation?.longitude
        ? { lat: partnerLocation.latitude, lng: partnerLocation.longitude }
        : null;

    // Calculate center between both locations
    const center = myCoords && partnerCoords
        ? {
            lat: (myCoords.lat + partnerCoords.lat) / 2,
            lng: (myCoords.lng + partnerCoords.lng) / 2
        }
        : myCoords || partnerCoords || { lat: 0, lng: 0 };

    // Calculate zoom level based on distance
    const calculateZoom = () => {
        if (!distance) return 5;
        if (distance < 50) return 10;
        if (distance < 200) return 8;
        if (distance < 500) return 6;
        if (distance < 2000) return 4;
        return 3;
    };

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    // Hug animation along the path
    const sendHugOnMap = () => {
        if (!myCoords || !partnerCoords) return;
        setShowHugAnimation(true);
        setHugProgress(0);

        const duration = 3000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setHugProgress(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => setShowHugAnimation(false), 1000);
            }
        };
        requestAnimationFrame(animate);
    };

    // Calculate position along path for hug animation
    const getHugPosition = () => {
        if (!myCoords || !partnerCoords) return null;
        return {
            lat: myCoords.lat + (partnerCoords.lat - myCoords.lat) * hugProgress,
            lng: myCoords.lng + (partnerCoords.lng - myCoords.lng) * hugProgress
        };
    };

    if (loadError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
                <div className="bg-card p-8 rounded-3xl text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-lg font-bold text-red-500">Failed to load Google Maps</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/10 rounded-xl">Close</button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 lg:p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-card w-full max-w-5xl h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-xl lg:text-2xl font-black flex items-center gap-3">
                                <MapPin className="text-emerald-500" />
                                Our Love Map
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
                                {distance ? `${Math.round(distance).toLocaleString()} km apart` : "Connecting hearts across the world"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Map Type Toggle */}
                        <div className="flex bg-white/5 rounded-xl p-1">
                            <button
                                onClick={() => setMapType("roadmap")}
                                className={`p-2 rounded-lg transition-all ${mapType === "roadmap" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-white"}`}
                            >
                                <MapIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMapType("satellite")}
                                className={`p-2 rounded-lg transition-all ${mapType === "satellite" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-white"}`}
                            >
                                <Satellite className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative">
                    {!isLoaded ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-card">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">Loading your love map...</p>
                            </div>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={calculateZoom()}
                            onLoad={onLoad}
                            mapTypeId={mapType}
                            options={{
                                styles: mapType === "roadmap" ? darkMapStyle : [],
                                disableDefaultUI: true,
                                zoomControl: true,
                                fullscreenControl: false,
                                mapTypeControl: false,
                            }}
                        >
                            {/* My Location Marker */}
                            {myCoords && (
                                <Marker
                                    position={myCoords}
                                    onClick={() => setSelectedMarker("me")}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: myRole === "sajid" ? "#3b82f6" : "#ec4899",
                                        fillOpacity: 1,
                                        strokeColor: "#ffffff",
                                        strokeWeight: 3,
                                        scale: 12,
                                    }}
                                />
                            )}

                            {/* Partner Location Marker */}
                            {partnerCoords && (
                                <Marker
                                    position={partnerCoords}
                                    onClick={() => setSelectedMarker("partner")}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: myRole === "sajid" ? "#ec4899" : "#3b82f6",
                                        fillOpacity: 1,
                                        strokeColor: "#ffffff",
                                        strokeWeight: 3,
                                        scale: 12,
                                    }}
                                />
                            )}

                            {/* Connection Line */}
                            {myCoords && partnerCoords && (
                                <Polyline
                                    path={[myCoords, partnerCoords]}
                                    options={{
                                        strokeColor: "#ec4899",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 3,
                                        icons: [{
                                            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                                            offset: "50%",
                                        }],
                                    }}
                                />
                            )}

                            {/* Hug Animation Marker */}
                            {showHugAnimation && getHugPosition() && (
                                <Marker
                                    position={getHugPosition()!}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: "#f472b6",
                                        fillOpacity: 1,
                                        strokeColor: "#ffffff",
                                        strokeWeight: 2,
                                        scale: 8,
                                    }}
                                    zIndex={1000}
                                />
                            )}

                            {/* Info Windows */}
                            {selectedMarker === "me" && myCoords && (
                                <InfoWindow position={myCoords} onCloseClick={() => setSelectedMarker(null)}>
                                    <div className="p-2 text-black">
                                        <p className="font-bold">📍 You are here</p>
                                        <p className="text-xs text-gray-600">{myLocation?.name || "Your location"}</p>
                                    </div>
                                </InfoWindow>
                            )}

                            {selectedMarker === "partner" && partnerCoords && (
                                <InfoWindow position={partnerCoords} onCloseClick={() => setSelectedMarker(null)}>
                                    <div className="p-2 text-black">
                                        <p className="font-bold">💕 Your love is here</p>
                                        <p className="text-xs text-gray-600">{partnerLocation?.name || "Partner's location"}</p>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    )}

                    {/* Floating Stats Card */}
                    <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-72">
                        <div className="glass rounded-2xl p-4 border border-white/10 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${myRole === "sajid" ? "bg-blue-500" : "bg-pink-500"}`} />
                                    <span className="text-xs font-bold uppercase">You</span>
                                </div>
                                <Heart className="w-4 h-4 text-pink-500 fill-current animate-pulse" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase">Love</span>
                                    <div className={`w-3 h-3 rounded-full ${myRole === "sajid" ? "bg-pink-500" : "bg-blue-500"}`} />
                                </div>
                            </div>

                            {distance && (
                                <div className="text-center mb-3">
                                    <span className="text-3xl font-black text-emerald-500">{Math.round(distance).toLocaleString()}</span>
                                    <span className="text-sm text-muted-foreground ml-2">km apart</span>
                                </div>
                            )}

                            <button
                                onClick={sendHugOnMap}
                                disabled={showHugAnimation || !myCoords || !partnerCoords}
                                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {showHugAnimation ? (
                                    <>
                                        <Plane className="w-4 h-4 animate-bounce" />
                                        Sending Love...
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-4 h-4 fill-current" />
                                        Send a Hug Across the Map
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-center text-muted-foreground mt-3 italic">
                                "No matter the distance, our hearts are always close."
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
