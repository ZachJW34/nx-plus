import { ExecutorContext } from '@nrwl/devkit';
import { ServerExecutorSchema } from './schema';
export default function runExecutor(options: ServerExecutorSchema, context: ExecutorContext): AsyncGenerator<{
    success: boolean;
    baseUrl: any;
}, void, unknown>;
