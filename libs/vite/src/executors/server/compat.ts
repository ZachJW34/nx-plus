import { convertNxExecutor } from '@nx/devkit';
import { default as serverExecutor } from './executor';

export default convertNxExecutor(serverExecutor);
