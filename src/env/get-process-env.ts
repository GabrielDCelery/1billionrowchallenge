import zod from 'zod';

const runTimeEnvSchema = zod.object({
    BRC_LOG_LEVEL: zod
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .optional()
        .default('error'),
    BRC_FILEPATH: zod.string(),
    VISUALIZER: zod.enum(['default']).optional().default('default'),
});

type ProcessEnv = zod.infer<typeof runTimeEnvSchema>;

export const getProcessEnv = (): ProcessEnv => {
    return runTimeEnvSchema.parse(process.env);
};
