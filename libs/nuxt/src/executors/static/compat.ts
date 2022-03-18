import { convertNxExecutor } from '@nrwl/devkit';
import { default as staticExecutor } from './executor';

export default convertNxExecutor(staticExecutor);
