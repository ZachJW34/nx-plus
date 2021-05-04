import { JsonObject } from '@angular-devkit/core';

export interface StaticBuilderSchema extends JsonObject {
  buildDir: string;
}
