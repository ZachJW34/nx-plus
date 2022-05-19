import { ExecutorContext } from '@nrwl/devkit';
import { ApplicationGeneratorSchema } from './generators/application/schema';
export declare function getProjectRoot(context: ExecutorContext): string;
export declare function loadModule(request: string, context: string, force?: boolean): any;
export declare function checkPeerDeps(options: ApplicationGeneratorSchema): void;
