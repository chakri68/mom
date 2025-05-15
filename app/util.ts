export function decodeBase64Json<T>(base64: string): T {
  const jsonString = atob(base64);
  return JSON.parse(jsonString);
}

export function encodeBase64Json<T>(data: T): string {
  const jsonString = JSON.stringify(data);
  return btoa(jsonString);
}

/**
 * Convert a snake_case string to normal text: "hello_world" -> "Hello World"
 * @param str The snake_case string to convert
 * @returns The converted string in normal text
 * @example
 * snakeCaseToNormalText("hello_world") // "Hello World"
 * snakeCaseToNormalText("this_is_a_test") // "This Is A Test"
 */
export function snakeCaseToNormalText(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
