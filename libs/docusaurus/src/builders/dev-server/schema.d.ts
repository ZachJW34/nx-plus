import { JsonObject } from '@angular-devkit/core';

export interface DevServerBuilderSchema extends JsonObject {
  port: number;
  host: string;
  hotOnly: boolean;
  open: boolean;
}
