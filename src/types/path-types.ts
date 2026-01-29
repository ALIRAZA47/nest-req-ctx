/**
 * Helper type for recursive depth limiting
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Extracts all possible dot-notation paths from an object type
 * Supports up to 5 levels of nesting by default
 *
 * @template T - The object type to extract paths from
 * @template MaxDepth - Maximum nesting depth (default: 5)
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   profile: {
 *     name: string;
 *     email: string;
 *     address: {
 *       city: string;
 *       country: string;
 *     };
 *   };
 * }
 *
 * type UserPaths = PathsOf<User>;
 * // 'id' | 'profile' | 'profile.name' | 'profile.email' |
 * // 'profile.address' | 'profile.address.city' | 'profile.address.country'
 * ```
 */
export type PathsOf<T, MaxDepth extends number = 5> = MaxDepth extends 0
  ? never
  : T extends object
    ? T extends Array<any>
      ? never // Don't generate paths for arrays
      : {
          [K in keyof T & string]: T[K] extends object
            ? T[K] extends Array<any>
              ? K // Arrays are terminal nodes
              : K | `${K}.${PathsOf<T[K], Prev[MaxDepth]>}`
            : K;
        }[keyof T & string]
    : never;

/**
 * Gets the value type at a given dot-notation path
 * Returns `never` if the path is invalid
 *
 * @template T - The object type
 * @template P - The dot-notation path string
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   profile: {
 *     name: string;
 *     email: string;
 *   };
 * }
 *
 * type Email = DeepValue<User, 'profile.email'>; // string
 * type Profile = DeepValue<User, 'profile'>; // { name: string; email: string }
 * type Invalid = DeepValue<User, 'profile.invalid'>; // never
 * ```
 */
export type DeepValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Makes a path type-safe by checking if it's a valid path for the given type
 *
 * @template T - The object type
 * @template P - The path to validate
 *
 * @example
 * ```typescript
 * interface Store {
 *   user: { name: string };
 * }
 *
 * type ValidPath = SafePath<Store, 'user.name'>; // 'user.name'
 * type InvalidPath = SafePath<Store, 'user.invalid'>; // never
 * ```
 */
export type SafePath<T, P extends string> = P extends PathsOf<T> ? P : never;

/**
 * Creates a union of all leaf paths (non-object values) in a type
 *
 * @template T - The object type
 * @template MaxDepth - Maximum nesting depth
 *
 * @example
 * ```typescript
 * interface Config {
 *   app: {
 *     name: string;
 *     version: number;
 *   };
 *   features: {
 *     darkMode: boolean;
 *   };
 * }
 *
 * type LeafPaths = LeafPathsOf<Config>;
 * // 'app.name' | 'app.version' | 'features.darkMode'
 * ```
 */
export type LeafPathsOf<T, MaxDepth extends number = 5> = MaxDepth extends 0
  ? never
  : T extends object
    ? T extends Array<any>
      ? never
      : {
          [K in keyof T & string]: T[K] extends object
            ? T[K] extends Array<any>
              ? K
              : `${K}.${LeafPathsOf<T[K], Prev[MaxDepth]>}`
            : K;
        }[keyof T & string]
    : never;

/**
 * Helper type for creating typed getters
 *
 * @template T - The store type
 *
 * @example
 * ```typescript
 * interface MyStore {
 *   user: User;
 *   settings: Settings;
 * }
 *
 * function get<P extends PathsOf<MyStore>>(path: P): DeepValue<MyStore, P>;
 * ```
 */
export type TypedGetter<T> = <P extends PathsOf<T>>(path: P) => DeepValue<T, P>;

/**
 * Utility type to get all keys of a nested object at a specific depth
 *
 * @template T - The object type
 * @template Depth - The depth level (0 = top level)
 */
export type KeysAtDepth<
  T,
  Depth extends number = 0,
> = Depth extends 0
  ? keyof T & string
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends object
          ? KeysAtDepth<T[K], Prev[Depth]>
          : never;
      }[keyof T & string]
    : never;
