export interface ComponentSchematicSchema {
  name: string;
  project: string;
  directory?: string;
  style: Style;
}

export type Style = 'css' | 'scss' | 'less' | 'stylus';
