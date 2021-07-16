import { convertNxExecutor } from '@nrwl/devkit';
import { default as buildExecutor } from './executor';

export default convertNxExecutor(buildExecutor);
