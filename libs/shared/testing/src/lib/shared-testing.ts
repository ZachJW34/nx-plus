import { runNxCommandAsync } from '@nx/plugin/testing';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stripAnsi = require('strip-ansi');

export async function runNxCommandAsyncStripped(
  ...args: Parameters<typeof runNxCommandAsync>
): ReturnType<typeof runNxCommandAsync> {
  const { stdout, stderr } = await runNxCommandAsync(...args);

  return {
    stdout: stripAnsi(stdout),
    stderr: stripAnsi(stderr),
  };
}
