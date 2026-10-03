export const formatThaiDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            calendar: 'buddhist',
            timeZone: 'Asia/Bangkok'
        } as any).format(date) + " น.";
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateString;
    }
};

export const formatThaiDateOnly = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            calendar: 'buddhist',
            timeZone: 'Asia/Bangkok'
        } as any).format(date);
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateString;
    }
};

export const formatThaiDateNumeric = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = (date.getFullYear() + 543).toString();
        return `${day}/${month}/${year}`;
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateString;
    }
};

export const formatEnglishDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        }).format(date);
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateString;
    }
};

export const formatEnglishDateOnly = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        }).format(date);
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateString;
    }
};

export const getThaiFiscalYear = (dateStr?: string | null): string => {
    if (!dateStr) return '2570';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2570';
    const yearCE = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    const fiscalYear = month >= 10 ? yearCE + 544 : yearCE + 543;
    return fiscalYear.toString();
};

export const parseFiscalYearAndDateFromFilename = (
    filename: string
): { fiscalYear: string | null; date: string | null } => {
    if (!filename) return { fiscalYear: null, date: null };

    // 1. BE year first with delimiters: YYYY[-_./]M[-_./]D (e.g. 2569.01.01, 2569-10-01, 2569_10_01)
    const beDelimited = Array.from(
        filename.matchAll(/(?:^|[^\d])((?:25|26)\d{2})[-_./](\d{1,2})[-_./](\d{1,2})(?:[^\d]|$)/g)
    );
    if (beDelimited.length > 0) {
        const last = beDelimited[beDelimited.length - 1];
        const year = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const day = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const fiscalYear = month >= 10 ? year + 1 : year;
            const ceYear = year - 543;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 2. BE year compact or partial dot: YYYYMMDD or YYYYMM.DD (e.g. 25690930, 25691001, 256901.01, 25700930)
    const beCompact = Array.from(
        filename.matchAll(/(?:^|[^\d])((?:25|26)\d{2})(\d{2})[-_./]?(\d{2})(?:[^\d]|$)/g)
    );
    if (beCompact.length > 0) {
        const last = beCompact[beCompact.length - 1];
        const year = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const day = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const fiscalYear = month >= 10 ? year + 1 : year;
            const ceYear = year - 543;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 3. DD-MM-YYYY (BE year 25xx)
    const dmyBe = Array.from(
        filename.matchAll(/(?:^|[^\d])(\d{1,2})[-_./](\d{1,2})[-_./]((?:25|26)\d{2})(?:[^\d]|$)/g)
    );
    if (dmyBe.length > 0) {
        const last = dmyBe[dmyBe.length - 1];
        const day = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const year = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const fiscalYear = month >= 10 ? year + 1 : year;
            const ceYear = year - 543;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 4. CE year first: YYYY-MM-DD or YYYY.M.D (e.g. 2026-5-5, 2026-10-01)
    const ceDelimited = Array.from(
        filename.matchAll(/(?:^|[^\d])(20\d{2})[-_./](\d{1,2})[-_./](\d{1,2})(?:[^\d]|$)/g)
    );
    if (ceDelimited.length > 0) {
        const last = ceDelimited[ceDelimited.length - 1];
        const ceYear = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const day = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const beYear = ceYear + 543;
            const fiscalYear = month >= 10 ? beYear + 1 : beYear;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 5. Compact CE: YYYYMMDD or YYYYMM.DD (e.g. 20261001, 202601.01)
    const ceCompact = Array.from(
        filename.matchAll(/(?:^|[^\d])(20\d{2})(\d{2})[-_./]?(\d{2})(?:[^\d]|$)/g)
    );
    if (ceCompact.length > 0) {
        const last = ceCompact[ceCompact.length - 1];
        const ceYear = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const day = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const beYear = ceYear + 543;
            const fiscalYear = month >= 10 ? beYear + 1 : beYear;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 6. DD-MM-YYYY (CE year 20xx) (e.g. 21-05-2026)
    const dmyCe = Array.from(
        filename.matchAll(/(?:^|[^\d])(\d{1,2})[-_./](\d{1,2})[-_./](20\d{2})(?:[^\d]|$)/g)
    );
    if (dmyCe.length > 0) {
        const last = dmyCe[dmyCe.length - 1];
        const day = parseInt(last[1], 10);
        const month = parseInt(last[2], 10);
        const ceYear = parseInt(last[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const beYear = ceYear + 543;
            const fiscalYear = month >= 10 ? beYear + 1 : beYear;
            const dateStr = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { fiscalYear: fiscalYear.toString(), date: dateStr };
        }
    }

    // 7. BE Year only: 25xx or 26xx (e.g. Telemedicine_2570.xlsx)
    const yearOnly = Array.from(
        filename.matchAll(/(?:^|[^\d])((?:25|26)\d{2})(?:[^\d]|$)/g)
    );
    if (yearOnly.length > 0) {
        const last = yearOnly[yearOnly.length - 1];
        return { fiscalYear: last[1], date: null };
    }

    // 8. CE Year only: 20xx (e.g. Telemedicine_2026.xlsx -> 2569, Telemedicine_2027.xlsx -> 2570)
    const ceYearOnly = Array.from(
        filename.matchAll(/(?:^|[^\d])(20\d{2})(?:[^\d]|$)/g)
    );
    if (ceYearOnly.length > 0) {
        const last = ceYearOnly[ceYearOnly.length - 1];
        const ceYear = parseInt(last[1], 10);
        const beYear = ceYear + 543;
        return { fiscalYear: beYear.toString(), date: null };
    }

    return { fiscalYear: null, date: null };
};
