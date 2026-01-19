"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker
                .register("/sw.js")
                .then(function (swReg) {
                    console.log("Service Worker is registered", swReg);
                })
                .catch(function (error) {
                    console.error("Service Worker Error", error);
                });
        }
    }, []);

    return null;
}
