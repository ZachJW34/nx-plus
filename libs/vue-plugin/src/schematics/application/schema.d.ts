export interface ApplicationSchematicSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner: 'jest' | 'none';
  e2eTestRunner: 'cypress' | 'none';
  skipFormat: boolean;
}
