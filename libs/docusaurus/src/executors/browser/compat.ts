import { convertNxExecutor } from '@nx/devkit';
import { default as browserExecutor } from './executor';

export default convertNxExecutor(browserExecutor);
