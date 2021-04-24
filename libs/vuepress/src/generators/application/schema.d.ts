export interface ApplicationGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  vuepressVersion: number;
  skipFormat: boolean;
}
