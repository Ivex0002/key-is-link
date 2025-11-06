import { ApiTree, HttpMethod, RequestExecutor } from "./types";

/**
 * 런타임에서 HTTP 메서드를 구분하기 위한 상수.
 * - 객체 기반 API 스키마를 파싱할 때 메서드 이름 대문자 변환 후 비교.
 */
export const HTTP_METHODS = new Set<HttpMethod>([
  "GET",
  "DELETE",
  "POST",
  "PUT",
  "PATCH",
  "HEAD",
  "OPTIONS",
]);

type GetNestedType<T, K extends string> = K extends keyof T ? T[K] : object;

/**
 * API Tree 생성 함수
 *
 * 타입만으로 자동완성을 제공하고, 런타임에는 경로를 파싱하여 요청을 실행
 *
 */
export function keyIsLink<T, Config>(
  requestFn: RequestExecutor<Config>, // 요청 로직
  pathSegments: string[] = [] // 경로 누적 저장용
): ApiTree<T, Config> {
  return new Proxy(() => {}, {
    // 프로퍼티 접근 (경로 탐색)
    get(_target, prop: string | symbol): unknown {
      if (typeof prop !== "string") {
        return undefined;
      }

      // 모든 프로퍼티를 경로 세그먼트로 추가
      return keyIsLink<GetNestedType<T, typeof prop>, Config>(requestFn, [
        ...pathSegments,
        prop,
      ]);
    },

    // 함수 호출
    apply(_target, _thisArg, args: unknown[]): unknown {
      const lastSegment = pathSegments[pathSegments.length - 1];

      // 1순위: HTTP 메서드 실행
      if (
        lastSegment &&
        HTTP_METHODS.has(lastSegment.toUpperCase() as HttpMethod)
      ) {
        const [data, config] = args;
        const method = lastSegment.toUpperCase();
        const path = normalizeUrl(joinPath(...pathSegments.slice(0, -1)));

        return requestFn(path, method as HttpMethod, data, config as Config);
      }

      // 2순위: 파라미터 삽입 (직접 호출)
      if (args.length > 0) {
        return keyIsLink<T, Config>(requestFn, [
          ...pathSegments,
          String(args[0]),
        ]);
      }

      throw new Error(`Cannot call path: ${pathSegments.join("/")}`);
    },
  }) as ApiTree<T, Config>;
}

/**
 * URL 경로 세그먼트를 안전하게 병합.
 * 타입 객체 내부의 키값에서 "-"을 사용할수 없기에, $로 대체
 * 현 메서드에서 "$"를 "-"으로 변경
 */
function joinPath(...segments: (string | number)[]): string {
  return segments
    .reduce<string[]>((acc, seg) => {
      if (seg == null || seg === "") return acc;
      const str = String(seg).replace(/\$/g, "-");
      if (str) acc.push(str);
      return acc;
    }, [])
    .join("/");
}

/**
 * URL 경로를 정규화.
 * - 중복 슬래시 제거 및 항상 `/`로 시작 보장.
 */
function normalizeUrl(path: string): string {
  if (!path) return "/";
  const normalized = path.replace(/\/+/g, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
