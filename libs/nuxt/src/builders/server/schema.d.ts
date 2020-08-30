import { JsonObject } from '@angular-devkit/core';

export interface ServerBuilderSchema extends JsonObject {
  browserTarget: string;
  watch: undefined;
  dev: boolean;
}
