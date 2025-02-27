import { format, Options } from 'prettier';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { createDecoderName } from './generation-utils';
import { FormatsPluginOptions } from 'ajv-formats';

export function generateCompileBasedDecoders(
  definitionNames: string[],
  addFormats: boolean,
  formatOptions: FormatsPluginOptions | undefined,
  outDirs: string[],
  prettierOptions: Options
): void {
  const definitionNamesCap = definitionNames.map((definitionName) => {
    return definitionName.charAt(0).toUpperCase() + definitionName.slice(1);
  });

  const decoders = definitionNames
    .map((definitionName) => {
      const definitionNameD =
        definitionName.charAt(0).toUpperCase() + definitionName.slice(1);
      return decoderTemplate
        .replace(/\$DecoderName/g, createDecoderName(definitionName))
        .replace(/\$ClassSmall/g, definitionName)
        .replace(/\$Class/g, definitionNameD)
        .trim();
    })
    .join('\n');

  const rawDecoderOutput = decodersFileTemplate
    .replace(
      /\$Imports/g,
      addFormats ? 'import addFormats from "ajv-formats"' : ''
    )
    .replace(
      /\$Formats/g,
      addFormats
        ? `addFormats(ajv, ${
            formatOptions ? JSON.stringify(formatOptions) : 'undefined'
          });`
        : ''
    )
    .replace(/\$ModelImports/g, definitionNamesCap.join(', '))
    .replace(/\$Decoders/g, decoders);

  const decoderOutput = format(rawDecoderOutput, prettierOptions);

  outDirs.forEach((outDir) => {
    mkdirSync(outDir, { recursive: true });

    writeFileSync(path.join(outDir, `decoders.ts`), decoderOutput);
  });
}

const decodersFileTemplate = `
/* eslint-disable */

import Ajv from 'ajv';
$Imports
import { Decoder } from './helpers';
import { validateJson } from './validate';
import { $ModelImports } from './models';
import jsonSchema from './schema.json';

const ajv = new Ajv(/*{ strict: false }*/);
ajv.compile(jsonSchema);
$Formats

// Decoders
$Decoders
`;

const decoderTemplate = `
export const $DecoderName: Decoder<$Class> = {
  definitionName: '$Class',
  schemaRef: '#/definitions/$ClassSmall',

  decode(json: unknown): $Class {
    const schema = ajv.getSchema($DecoderName.schemaRef);
    if (!schema) {
      throw new Error(\`Schema \${$DecoderName.definitionName} not found\`);
    }
    return validateJson(json, schema, $DecoderName.definitionName);
  }
}
`;
