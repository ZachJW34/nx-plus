export interface ApplicationGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  style: 'css' | 'scss' | 'less' | 'stylus';
  unitTestRunner: 'jest' | 'none';
  e2eTestRunner: 'cypress' | 'none';
  routing: boolean;
  vueVersion: number;
  skipFormat: boolean;
  babel: boolean;
}
