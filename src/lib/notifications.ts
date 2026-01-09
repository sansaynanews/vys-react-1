
export async function sendNotification(type: 'sms' | 'email', to: string, message: string) {
    // Mock function - in production this would integrate with a provider like Twilio, SendGrid, etc.
    console.log(`[NOTIFICATION - ${type.toUpperCase()}] To: ${to}, Message: ${message}`);
    return true;
}

export async function notifyAppointmentCreated(appointment: any) {
    // Notify Visitor
    if (appointment.iletisim) {
        const dateStr = new Date(appointment.tarih).toLocaleDateString('tr-TR');
        await sendNotification('sms', appointment.iletisim, `Sayın ${appointment.ad_soyad}, Valilik Makamı randevunuz ${dateStr} ${appointment.saat} için oluşturulmuştur.`);
    }
}

export async function notifyAppointmentUpdated(appointment: any, status: string) {
    if (appointment.iletisim) {
        let msg = `Sayın ${appointment.ad_soyad}, randevu durumunuz güncellendi: ${status}.`;
        if (status === 'Ertelendi') {
            msg = `Sayın ${appointment.ad_soyad}, randevunuz ertelenmiştir. Lütfen sekreterya ile görüşünüz.`;
        }
        await sendNotification('sms', appointment.iletisim, msg);
    }
}
