import zod from 'zod';

const runTimeEnvSchema = zod.object({
    LOG_LEVEL: zod
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .optional()
        .default('error'),
    WEATHER_STATION_DATA_FILE_PATH: zod.string(),
    VISUALIZER: zod.enum(['default']).optional().default('default'),
});

export type ProcessEnv = zod.infer<typeof runTimeEnvSchema>;

export const getProcessEnv = (): ProcessEnv => {
    return runTimeEnvSchema.parse(process.env);
};
