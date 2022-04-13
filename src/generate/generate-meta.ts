import { format, Options } from 'prettier';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

export function generateMetaFile(
  definitionNames: string[],
  outDirs: string[],
  prettierOptions: Options
): void {
  const definitionNamesCap = definitionNames.map((definitionName) => {
    return definitionName.charAt(0).toUpperCase() + definitionName.slice(1);
  });
  const metas = definitionNames
    .map((definitionName) => {
      const definitionNameD =
        definitionName.charAt(0).toUpperCase() + definitionName.slice(1);
      return `${definitionName}: info<${definitionNameD}>('${definitionName}', '#/definitions/${definitionName}'),`;
    })
    .join('\n');

  // console.log('metas = ', metas);

  const rawOutput = metaTemplate
    .replace(/\$Definitions/g, metas)
    .replace(/\$ModelImports/g, definitionNamesCap.join(', '));

  const output = format(rawOutput, prettierOptions);

  outDirs.forEach((outDir) => {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, `meta.ts`), output);
  });
}

const metaTemplate = `
/* eslint-disable */
import { $ModelImports } from './models';

export const schemaDefinitions = {
  $Definitions
}

export interface SchemaInfo<T> {
  definitionName: string;
  schemaRef: string;
}

function info<T>(definitionName: string, schemaRef: string): SchemaInfo<T> {
  return { definitionName, schemaRef };
}
`;
