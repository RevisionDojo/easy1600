import cliProgress from 'cli-progress';
import { logger } from './logger.js';

export class ProgressTracker {
    constructor(total, operation) {
        this.total = total;
        this.operation = operation;
        this.current = 0;

        this.bar = new cliProgress.SingleBar({
            format: `${operation} |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | Speed: {speed}/s`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        this.bar.start(total, 0, { speed: 0 });
        this.startTime = Date.now();
    }

    update(increment = 1) {
        this.current += increment;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const speed = elapsed > 0 ? Math.round(this.current / elapsed) : 0;

        this.bar.update(this.current, { speed });

        // Log progress at intervals
        if (this.current % 1000 === 0 || this.current === this.total) {
            logger.progress(this.current, this.total, this.operation);
        }
    }

    complete() {
        this.bar.stop();
        const elapsed = (Date.now() - this.startTime) / 1000;
        const speed = elapsed > 0 ? Math.round(this.current / elapsed) : 0;

        logger.info(`✅ ${this.operation} completed: ${this.current}/${this.total} in ${elapsed.toFixed(1)}s (${speed}/s)`);
    }

    error(message) {
        this.bar.stop();
        logger.error(`❌ ${this.operation} failed: ${message}`);
    }
}
