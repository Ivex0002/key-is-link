export type HttpMethod =
  | "GET"
  | "DELETE"
  | "POST"
  | "PUT"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

// HttpMethod 일때 req 유무에 따른 분기처리
type MethodHandler<T, Config> = T extends (...args: infer Args) => infer Ret
  ? Args extends []
    ? Ret extends { res: infer S }
      ? () => Promise<S>
      : () => Promise<void>
    : Args extends [infer First, ...infer Rest]
      ? [First] extends [null]
        ? Rest extends [infer OptionalConfig] 
          ? OptionalConfig extends Config | undefined 
            ? Ret extends { res: infer S }
              ? (data: null, config?: Config) => Promise<S>
              : (data: null, config?: Config) => Promise<void>
            : never
          : never
        : Args extends [infer Q, infer OptionalConfig] 
          ? OptionalConfig extends Config | undefined
            ? Ret extends { res: infer S }
              ? (data?: Q, config?: Config) => Promise<S>
              : (data?: Q, config?: Config) => Promise<void>
            : never
          : never
      : never
  : never;

// src\api\apiTree.ts 타입 지정용
// 들어온 타입객체 키값에 따른 분기처리
export type ApiTree<T, Config> = {
  [K in keyof T]: K extends HttpMethod
    ? MethodHandler<T[K], Config>
    : ApiTree<T[K] extends object ? T[K] : unknown, Config>;
} & (T extends (...args: infer Args) => infer R
  ? (...args: Args) => ApiTree<R, Config>
  : unknown);

/**
 * API 요청을 수행하는 함수 시그니처.
 * - keyIsLink에 주입되어 모든 요청이 이를 통해 수행됨.
 */
export type RequestExecutor<Config = any> = <Req, Res>(
  url: string,
  method: HttpMethod,
  data?: Req,
  config?: Config
) => Promise<Res>;
