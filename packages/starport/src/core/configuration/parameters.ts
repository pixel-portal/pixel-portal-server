
import { parseArgs } from "util";


export function loadParameters (): Parameters | undefined {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      dev: {
        type: 'boolean',
      },
      configuration: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: true,
  });

  return values;
}

export default interface Parameters {
  dev: boolean | undefined;
  configuration: string | undefined;
}
