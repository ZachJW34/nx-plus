import { convertNxExecutor } from '@nx/devkit';
import { default as staticExecutor } from './executor';

export default convertNxExecutor(staticExecutor);
