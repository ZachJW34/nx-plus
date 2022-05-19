import { ExecutorContext } from '@nrwl/devkit';
import { StaticExecutorSchema } from './schema';
export default function runExecutor(options: StaticExecutorSchema, context: ExecutorContext): AsyncGenerator<{
    success: boolean;
}, void, unknown>;
