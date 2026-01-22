import dayjs from "dayjs";

export function subtractIntervals(work, blocked) {
  const result = [];
  let prev = work.start;

  for (const block of blocked) {
    // free slot before this block
    if (block.start > prev) {
      result.push({
        start: new Date(prev),
        end: new Date(block.start)
      });
    }

    // move pointer forward
    prev = new Date(Math.max(prev.getTime(), block.end.getTime()));
  }

  // free slot after last block
  if (prev < work.end) {
    result.push({
      start: new Date(prev),
      end: new Date(work.end)
    });
  }

  return result;
}


export function mergeIntervals(blocked) {
  const result = [];
  if (!blocked || blocked.length === 0) return result;

  blocked.sort((a, b) => new Date(a.start) - new Date(b.start));

  result.push(blocked[0]);
  let j = 0;
  for (let i = 1; i < blocked.length; i++) {
    if (blocked[i].start <= result[j].end) {
      result[j].end = new Date(Math.max(blocked[i].end.getTime(), result[j].end.getTime()));
    }
    else {
      result.push(blocked[i]), j++;
    }
  }

  return result;
};

