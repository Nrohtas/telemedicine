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
