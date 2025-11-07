export type HttpMethod =
  | "GET"
  | "DELETE"
  | "POST"
  | "PUT"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

// HttpMethod 일때 req 유무에 따른 분기처리
type MethodHandler<T, Config> =
  // : 데이터 없이 config만 – null/config 강제
  T extends (req: null, config: Config) => { res: infer S }
    ? (data: null, config: Config) => Promise<S>
    : T extends (req: null, config: Config) => {}
    ? (data: null, config: Config) => Promise<void>
    : // no-req – 단순 호출
    T extends () => { res: infer S }
    ? () => Promise<S>
    : T extends () => {}
    ? () => Promise<void>
    : // with-req - 데이터, config 호출 가능
    T extends (req: infer Q) => { res: infer S }
    ? (data?: Q, config?: Config) => Promise<S>
    : T extends (req: infer Q) => {}
    ? (data?: Q, config?: Config) => Promise<void>
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
