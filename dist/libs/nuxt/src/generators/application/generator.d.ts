import { Tree } from '@nrwl/devkit';
import { ApplicationGeneratorSchema } from './schema';
export declare function applicationGenerator(tree: Tree, schema: ApplicationGeneratorSchema): Promise<import("@nrwl/devkit").GeneratorCallback>;
export declare const applicationSchematic: (generatorOptions: ApplicationGeneratorSchema) => (tree: any, context: any) => Promise<any>;
