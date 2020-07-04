export interface ApplicationSchematicSchema {
  name: string;
  tags?: string;
  directory?: string;
  style: 'css' | 'scss' | 'less' | 'stylus';
  unitTestRunner: 'jest' | 'none';
  e2eTestRunner: 'cypress' | 'none';
  routing: boolean;
  skipFormat: boolean;
}
