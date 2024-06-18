import { promises as fs } from 'fs';

type PromiseFunction<T, A extends any[]> = (...args: A) => Promise<T>;

/**
  * Create a cached function
  * @param promiseFunc - the promise function
  * @param filePath - the file path
  * @param alwaysRunPromise - run the promise at startup or skip waiting
  * @returns - the result of cached function
  */
export default function createCachedFn<T, A extends any[]>(
  promiseFunc: PromiseFunction<T, A>,
  filePath: string,
  alwaysRunPromise = false
): (...args: A) => Promise<T> {
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

  async function executePromise(...args: A): Promise<T> {
    const result = await promiseFunc(...args);
    await writeCache(result);
    return result;
  }

  return async function getResult(...args: A): Promise<T> {
    if (firstRun && alwaysRunPromise) {
      firstRun = false;
      promiseInProgress = executePromise(...args);
      const result = await promiseInProgress;
      promiseInProgress = null;
      cachedResult = result;
      return result;
    }

    if (alwaysRunPromise) {
      promiseInProgress = executePromise(...args).then(result => {
        cachedResult = result;
        promiseInProgress = null;
        return result;
      }).catch(error => {
        promiseInProgress = null;
        throw error;
      });
    } else if (promiseInProgress === null) {
      promiseInProgress = executePromise(...args).then(result => {
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
    console.log('c', !!cachedResult)
    if (cachedResult !== null) {
      return cachedResult;
    }

    if (promiseInProgress !== null) {
      return promiseInProgress;
    }

    promiseInProgress = executePromise(...args).then(result => {
      cachedResult = result;
      promiseInProgress = null;
      return result;
    });

    return promiseInProgress;
  };
}
