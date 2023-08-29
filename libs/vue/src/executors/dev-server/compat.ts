import { convertNxExecutor } from '@nx/devkit';
import { default as devServerExecutor } from './executor';

export default convertNxExecutor(devServerExecutor);
