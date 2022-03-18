import { convertNxExecutor } from '@nrwl/devkit';
import { default as browserExecutor } from './executor';

export default convertNxExecutor(browserExecutor);
