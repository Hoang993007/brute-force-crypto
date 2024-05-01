import { promises as fs } from 'fs';

export const readFileJson = async (
  filePath: string,
  options?: { [key: string]: any },
) => {
  const res = await fs.readFile(filePath, { encoding: 'utf8', ...options });
  return JSON.parse(res);
};

export const writeFileJson = async (
  path: string,
  data: { [key: string]: any },
  options?: { [key: string]: any },
) => {
  await fs.writeFile(path, JSON.stringify(data), {
    encoding: 'utf8',
    ...options,
  });
};

export const modifyFileJson = async (
  filePath: string,
  data: { [key: string]: any },
) => {
  let curData;
  try {
    curData = await readFileJson(filePath);
  } catch (err) {}
  if (!curData) curData = {};
  const newData = { ...curData, ...data };
  await writeFileJson(filePath, newData);
};
