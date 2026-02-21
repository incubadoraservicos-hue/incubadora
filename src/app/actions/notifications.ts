'use server'

import { adminMessaging } from "@/utils/firebase/admin-config";
import { createClient } from "@/utils/supabase/server";

export async function sendPushNotification(colaboradorId: string, title: string, body: string) {
    try {
        const supabase = await createClient();

        // 1. Buscar o token do colaborador
        const { data: colab, error } = await supabase
            .from('colaboradores')
            .select('fcm_token')
            .eq('id', colaboradorId)
            .single();

        if (error || !colab?.fcm_token) {
            console.log('Colaborador sem token de notificação:', colaboradorId);
            return { success: false, error: 'Token não encontrado' };
        }

        // 2. Enviar a mensagem via Firebase Admin
        const message = {
            notification: {
                title,
                body,
            },
            token: colab.fcm_token,
            android: {
                priority: 'high' as const,
                notification: {
                    sound: 'default',
                    clickAction: 'OPEN_ACTIVITY',
                },
            },
        };

        const response = await adminMessaging.send(message);
        console.log('Notificação enviada com sucesso:', response);

        // 3. Opcional: Logar a notificação na base de dados
        await supabase.from('notificacoes_log').insert([{
            user_id: colaboradorId, // assumindo correspondência de ID ou ajustar conforme necessário
            titulo: title,
            mensagem: body,
            estado: 'enviada'
        }]);

        return { success: true, messageId: response };
    } catch (error: any) {
        console.error('Erro ao enviar push notification:', error);
        return { success: false, error: error.message };
    }
}
