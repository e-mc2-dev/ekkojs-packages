// markdownGuard — recursion-depth budget + active-path guard for the markdown parser (wave 260).
// Recursive expanders over user input are a stack-overflow DoS; cap nesting depth and bail to plain
// text past the budget (see [[feedback_recursion_dos]]).
export const MD_MAX_DEPTH = 32;
export function mdGuard(depth: number): boolean {
  // returns true if it is SAFE to recurse one level deeper
  return depth < MD_MAX_DEPTH;
}
