export const getResFileName = (entropy: string) => {
  return `${entropy}.json`;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
