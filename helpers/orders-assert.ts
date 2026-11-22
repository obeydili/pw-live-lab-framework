export function isSortedDescending(numbers: number[]): boolean {
  return numbers.every((num, i) => {
    if (i === 0) return true; // First element has no previous to compare to
    return numbers[i - 1] >= num;
  });
}
