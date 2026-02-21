import { messaging } from "./config";
import { getToken } from "firebase/messaging";
import { createClient } from "@/utils/supabase/client";

export async function requestNotificationPermission(colaboradorId: string) {
    if (!messaging) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });

            if (token) {
                console.log('FCM Token:', token);
                const supabase = createClient();

                // Salvar o token no Supabase para este colaborador
                await supabase
                    .from('colaboradores')
                    .update({ fcm_token: token })
                    .eq('id', colaboradorId);

                return token;
            }
        }
    } catch (error) {
        console.error('Erro ao pedir permissão de notificação:', error);
    }
    return null;
}
