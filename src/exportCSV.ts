import { promises as fs, readdirSync } from 'fs';
import * as Papa from 'papaparse';
import path from 'path';
import { appConfig } from '../app/config';

export const extractResToCsv = async () => {
  const jsonsInDir = readdirSync(appConfig.RES_FOLDER_PATH).filter(
    (file) => path.extname(file) === '.json',
  );

  const dataToExtract = await Promise.all(
    jsonsInDir.map(async (file) => {
      const fileData = await fs.readFile(
        path.join(appConfig.RES_FOLDER_PATH, file),
      );
      return JSON.parse(fileData.toString());
    }),
  );

  const convertedData = Papa.unparse(dataToExtract, {
    delimiter: ',',
    header: true,
  });
  await fs.writeFile(appConfig.RES_FILE_PATH, convertedData, 'utf8');
};
