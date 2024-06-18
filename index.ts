import { promises as fs } from 'fs';

type PromiseFunction<T> = () => Promise<T>;

export default function createCachedFn<T>(
  promiseFunc: PromiseFunction<T>,
  filePath: string,
  alwaysRunPromise = false
): () => Promise<T> {
  let cachedResult: T | null = null;
  let promiseInProgress: Promise<T> | null = null;
  let firstRun = true;

  async function readCache(): Promise<T | null> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      } else {
        throw error;
      }
    }
  }

  async function writeCache(data: T): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  }

  async function executePromise(): Promise<T> {
    const result = await promiseFunc();
    await writeCache(result);
    return result;
  }

  return async function getResult(): Promise<T> {
    if (firstRun) {
      firstRun = false;
      promiseInProgress = executePromise();
      const result = await promiseInProgress;
      promiseInProgress = null;
      cachedResult = result;
      return result;
    }

    if (alwaysRunPromise) {
      promiseInProgress = executePromise().then(result => {
        cachedResult = result;
        promiseInProgress = null;
        return result;
      }).catch(error => {
        promiseInProgress = null;
        throw error;
      });
    } else if (promiseInProgress === null) {
      promiseInProgress = executePromise().then(result => {
        cachedResult = result;
        promiseInProgress = null;
        return result;
      }).catch(error => {
        promiseInProgress = null;
        throw error;
      });
    }

    if (cachedResult !== null) {
      return cachedResult;
    }

    cachedResult = await readCache();
    if (cachedResult !== null) {
      return cachedResult;
    }

    if (promiseInProgress !== null) {
      return promiseInProgress;
    }

    promiseInProgress = executePromise().then(result => {
      cachedResult = result;
      promiseInProgress = null;
      return result;
    });

    return promiseInProgress;
  };
}
