import winston from 'winston';

export const createLogger = ({
    logLevel,
}: {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}): winston.Logger => {
    const logger = winston.createLogger({
        levels: {
            fatal: 0,
            error: 1,
            warn: 2,
            info: 3,
            debug: 4,
            trace: 5,
        },
        level: logLevel,
        format: winston.format.combine(
            winston.format.colorize(),
            // winston.format.cli()
            winston.format.printf(({ level, message }) => {
                return `[${level}]: ${message}`;
            })
        ),
        transports: [new winston.transports.Console()],
    });

    return logger;
};
