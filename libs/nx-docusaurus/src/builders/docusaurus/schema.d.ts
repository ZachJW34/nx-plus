import { JsonObject } from '@angular-devkit/core';

export interface DocusaurusBuilderSchema extends JsonObject {
  port?: number;
  host?: string;
  hotOnly?: boolean;
  open?: boolean;
}
