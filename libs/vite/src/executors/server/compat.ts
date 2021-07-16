import { convertNxExecutor } from '@nrwl/devkit';
import { default as serverExecutor } from './executor';

export default convertNxExecutor(serverExecutor);
