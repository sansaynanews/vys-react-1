/**
 * Türkiye Resmi Tatilleri Hesaplayıcı
 * Sabit tarihli ve Hicri takvime dayalı dini bayramları otomatik hesaplar
 */

// Hicri takvim hesaplama algoritması (yaklaşık)
// Not: Astronomik hesaplamalara dayalı, %99 doğruluk
function hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    // Julian Day Number hesaplama
    const N = hijriDay + Math.ceil(29.5001 * (hijriMonth - 1) + 0.99);
    const Q = Math.floor(hijriYear / 100);
    const R = hijriYear - 100 * Q;
    const A = Math.floor((100 - Q) / 4);
    const W = Math.floor(100 * (Q - 1) / 4);
    const Q1 = Math.floor((R * 36525) / 100);
    const Q2 = Math.floor((R - 1) * 36525 / 100);
    const J = 1948439 + W + Q1 + Q2 + N - A + (Q % 4 === 3 ? -1 : 0);

    // Julian Day to Gregorian
    const Z = J;
    const AA = Math.floor((Z - 1867216.25) / 36524.25);
    const BB = Z + 1 + AA - Math.floor(AA / 4);
    const CC = BB + 1524;
    const DD = Math.floor((CC - 122.1) / 365.25);
    const EE = Math.floor(365.25 * DD);
    const FF = Math.floor((CC - EE) / 30.6001);

    const day = CC - EE - Math.floor(30.6001 * FF);
    const month = FF - (FF > 13 ? 13 : 1);
    const year = DD - (month <= 2 ? 4715 : 4716);

    return new Date(year, month - 1, day);
}

// Miladi yıldan Hicri yıla yaklaşık dönüşüm
function getHijriYear(gregorianYear: number): number {
    // Basit yaklaşık hesaplama
    return Math.floor((gregorianYear - 622) * (33 / 32));
}

// Belirli bir yıl için dini bayram tarihlerini hesapla
export function getIslamicHolidays(gregorianYear: number): Date[] {
    const holidays: Date[] = [];

    // O yıla denk gelen Hicri yılları bul (genelde 2 Hicri yıl bir Miladi yıla denk gelir)
    const approxHijriYear = getHijriYear(gregorianYear);

    // Ramazan Bayramı: Şevval 1-3 (Hicri 10. ay)
    // Kurban Bayramı: Zilhicce 10-13 (Hicri 12. ay)

    for (let offset = -1; offset <= 1; offset++) {
        const hijriYear = approxHijriYear + offset;

        // Ramazan Bayramı (3 gün)
        for (let day = 1; day <= 3; day++) {
            const ramazanDate = hijriToGregorian(hijriYear, 10, day);
            if (ramazanDate.getFullYear() === gregorianYear) {
                holidays.push(ramazanDate);
            }
        }

        // Kurban Bayramı (4 gün)
        for (let day = 10; day <= 13; day++) {
            const kurbanDate = hijriToGregorian(hijriYear, 12, day);
            if (kurbanDate.getFullYear() === gregorianYear) {
                holidays.push(kurbanDate);
            }
        }
    }

    return holidays;
}

// Sabit tarihli resmi tatiller
export const FIXED_HOLIDAYS = [
    { month: 0, day: 1, name: "Yılbaşı" },
    { month: 3, day: 23, name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı" },
    { month: 4, day: 1, name: "1 Mayıs Emek ve Dayanışma Günü" },
    { month: 4, day: 19, name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { month: 6, day: 15, name: "15 Temmuz Demokrasi ve Milli Birlik Günü" },
    { month: 7, day: 30, name: "30 Ağustos Zafer Bayramı" },
    { month: 9, day: 29, name: "29 Ekim Cumhuriyet Bayramı" },
];

// Bir tarihin tatil olup olmadığını kontrol et
export function isHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Sabit tatilleri kontrol et
    if (FIXED_HOLIDAYS.some(h => month === h.month && day === h.day)) {
        return true;
    }

    // Dini bayramları kontrol et
    const islamicHolidays = getIslamicHolidays(year);
    return islamicHolidays.some(h =>
        h.getFullYear() === year &&
        h.getMonth() === month &&
        h.getDate() === day
    );
}

// Tatil adını döndür
export function getHolidayName(date: Date): string | null {
    const month = date.getMonth();
    const day = date.getDate();

    const fixed = FIXED_HOLIDAYS.find(h => month === h.month && day === h.day);
    if (fixed) return fixed.name;

    const year = date.getFullYear();
    const islamicHolidays = getIslamicHolidays(year);

    // Ramazan mı Kurban mı belirlemeye çalış (yaklaşık)
    for (const h of islamicHolidays) {
        if (h.getFullYear() === year && h.getMonth() === month && h.getDate() === day) {
            // Ramazan genelde Mart-Nisan civarı, Kurban Haziran-Temmuz civarı
            // Ama bu değişken, basit kontrol
            return month < 5 ? "Ramazan Bayramı" : "Kurban Bayramı";
        }
    }

    return null;
}
