import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspace,
  validateWorkspace,
  serializeBackup,
  parseBackup,
  loadWorkspace,
  saveWorkspace,
  removeExamples,
  safeUrl,
  textStatistics,
  formatJson,
  FocusClock,
  STORAGE_KEY,
} from "../workspace.mjs";

function memoryStorage(initial) {
  const values = new Map(initial === undefined ? [] : [[STORAGE_KEY, initial]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("backup round-trip preserves notes, project steps and plan state", () => {
  const state = createWorkspace(false);
  state.notes.push({
    id: "n1",
    body: "思考 <script> & 家庭",
    direction: "life",
    createdAt: "2026-11-04T06:00:00Z",
    demo: false,
  });
  state.projects.push({
    id: "p1",
    title: "学习",
    direction: "learn",
    steps: [{ id: "s1", title: "练习", done: true }],
    demo: false,
  });
  state.plans.push({
    id: "b1",
    title: "复盘",
    direction: "ai",
    status: "active",
    demo: false,
  });
  const restored = parseBackup(serializeBackup(state));
  assert.equal(restored.notes[0].body, "思考 <script> & 家庭");
  assert.equal(restored.projects[0].steps[0].done, true);
  assert.equal(restored.plans[0].status, "active");
});

test("backups reject malformed collections, duplicate ids, unsafe URLs and unsupported versions", () => {
  for (const mutate of [
    (x) => {
      x.data.notes = null;
    },
    (x) => {
      x.data.tasks = [
        { id: "x", title: "a", direction: "ai", done: false },
        { id: "x", title: "b", direction: "ai", done: false },
      ];
    },
    (x) => {
      x.data.sites = [
        { id: "bad", name: "坏链接", url: "javascript:alert(1)" },
      ];
    },
    (x) => {
      x.version = 900;
    },
    (x) => {
      x.data.projects = [
        {
          id: "bad",
          title: "bad",
          direction: "ai",
          steps: [{ id: "s", title: "s", done: "false" }],
        },
      ];
    },
  ]) {
    const backup = JSON.parse(serializeBackup(createWorkspace(false)));
    mutate(backup);
    assert.throws(() => parseBackup(JSON.stringify(backup)));
  }
  assert.throws(() => parseBackup("not JSON"));
});

test("workspace schema rejects oversized or whitespace-only user content", () => {
  for (const title of ["   ", "a".repeat(301)]) {
    const state = createWorkspace(false);
    state.tasks.push({ id: "t", title, direction: "", done: false });
    assert.throws(() => validateWorkspace(state));
  }
});

test("an oversized workspace cannot replace a recoverable saved backup", () => {
  const storage = memoryStorage();
  saveWorkspace(storage, createWorkspace(false));
  const before = storage.getItem(STORAGE_KEY);
  const state = createWorkspace(false);
  state.notes = Array.from({ length: 300 }, (_, index) => ({
    id: `large-${index}`,
    body: "学".repeat(3000),
    direction: "",
  }));
  assert.throws(() => saveWorkspace(storage, state));
  assert.equal(storage.getItem(STORAGE_KEY), before);
});

test("corrupt storage is reported without overwriting original contents", () => {
  const storage = memoryStorage("{broken");
  const result = loadWorkspace(storage);
  assert.equal(result.status, "corrupt");
  assert.equal(result.raw, "{broken");
  assert.equal(storage.getItem(STORAGE_KEY), "{broken");
});

test("blocked storage reports failure and normal storage survives a reload", () => {
  const unavailable = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("quota");
    },
  };
  assert.equal(loadWorkspace(unavailable).status, "unavailable");
  assert.throws(() => saveWorkspace(unavailable, createWorkspace(false)));
  const storage = memoryStorage();
  const state = createWorkspace(false);
  state.tasks.push({
    id: "t1",
    title: "persist",
    direction: "ai",
    done: true,
    demo: false,
  });
  saveWorkspace(storage, state);
  const restored = loadWorkspace(storage);
  assert.equal(restored.status, "saved");
  assert.equal(restored.state.tasks[0].done, true);
});

test("clearing examples preserves personal additions and website shortcuts", () => {
  const state = createWorkspace(true);
  state.notes.push({
    id: "personal",
    body: "我自己的记录",
    direction: "",
    demo: false,
  });
  const cleaned = removeExamples(state);
  assert.equal(cleaned.notes.length, 1);
  assert.equal(cleaned.notes[0].body, "我自己的记录");
  assert.equal(cleaned.tasks.length, 0);
  assert.ok(cleaned.sites.length >= 4);
  assert.ok(state.tasks.length > 0, "does not mutate the original snapshot");
});

test("website URLs allow HTTP(S) but reject code, file URLs and embedded credentials", () => {
  assert.equal(
    safeUrl("https://example.com/path?q=1"),
    "https://example.com/path?q=1",
  );
  assert.equal(safeUrl("http://localhost:8080/"), "http://localhost:8080/");
  for (const input of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/a",
    "//example.com",
    "https://name:secret@example.com",
  ])
    assert.equal(safeUrl(input), null);
});

test("text tools count Unicode code points and reject invalid JSON without altering it", () => {
  assert.deepEqual(textStatistics("你好\nAI🙂"), {
    characters: 6,
    nonWhitespace: 5,
    lines: 2,
  });
  assert.deepEqual(textStatistics(""), {
    characters: 0,
    nonWhitespace: 0,
    lines: 0,
  });
  assert.equal(formatJson('{"a":1}'), '{\n  "a": 1\n}');
  assert.throws(() => formatJson("{invalid"));
});

test("focus countdown uses elapsed time, pauses precisely and expires without drift", () => {
  const clock = new FocusClock(1500);
  clock.start(1000);
  assert.deepEqual(clock.read(62000), {
    remainingSeconds: 1439,
    running: true,
  });
  clock.pause(62500);
  assert.deepEqual(clock.read(100000), {
    remainingSeconds: 1439,
    running: false,
  });
  clock.start(200000);
  assert.deepEqual(clock.read(200000 + 1438500), {
    remainingSeconds: 0,
    running: false,
  });
  clock.reset(300);
  assert.deepEqual(clock.read(9999999), {
    remainingSeconds: 300,
    running: false,
  });
  assert.throws(() => clock.reset(0));
  assert.throws(() => clock.reset(20000));
});
