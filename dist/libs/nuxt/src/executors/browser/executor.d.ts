import { BrowserExecutorSchema } from './schema';
import { ExecutorContext } from '@nrwl/devkit';
export default function runExecutor(options: BrowserExecutorSchema, context: ExecutorContext): AsyncGenerator<{
    success: boolean;
}, void, unknown>;
