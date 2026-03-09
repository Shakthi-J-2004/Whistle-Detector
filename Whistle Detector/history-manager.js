export class HistoryManager {
    constructor() {
        this.STORAGE_KEY = 'wc_history';
        this.maxItems = 10;
        this.history = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load history', e);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    }

    addEntry(count, target, successful) {
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            count,
            target,
            successful
        };

        this.history.unshift(entry);

        // Limit size
        if (this.history.length > this.maxItems) {
            this.history.pop();
        }

        this.save();
        return entry;
    }

    clear() {
        this.history = [];
        this.save();
    }

    getHistory() {
        return this.history;
    }
}
