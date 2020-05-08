export interface ApplicationSchematicSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner: 'jest' | 'none';
  skipFormat: boolean;
}
