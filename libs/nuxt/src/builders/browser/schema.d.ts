import { JsonObject } from '@angular-devkit/core';

export interface BrowserBuilderSchema extends JsonObject {
  buildDir: string;
}
