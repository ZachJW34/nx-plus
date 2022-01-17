import { convertNxExecutor } from '@nrwl/devkit';
import { default as devServerExecutor } from './executor';

export default convertNxExecutor(devServerExecutor);
