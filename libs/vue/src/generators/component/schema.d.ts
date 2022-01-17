export interface ComponentGeneratorSchema {
  name: string;
  project: string;
  directory?: string;
  style: Style;
}

export type Style = 'css' | 'scss' | 'less' | 'stylus';
