import { convertNxExecutor } from '@nx/devkit';
import { default as buildExecutor } from './executor';

export default convertNxExecutor(buildExecutor);
