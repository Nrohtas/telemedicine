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
