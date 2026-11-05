export const STORAGE_KEY = "personal-cockpit.workspace.v1";
export const DIRECTIONS = [
  { id: "invest", name: "投资与期权", color: "#8bb9ff", icon: "chart" },
  { id: "ai", name: "AI 使用与前沿", color: "#b699ed", icon: "spark" },
  { id: "govern", name: "开源治理", color: "#8edbb0", icon: "code" },
  { id: "learn", name: "AI 辅助学习", color: "#78e4e9", icon: "learn" },
  { id: "life", name: "个人与家庭", color: "#e5a6b4", icon: "people" },
];
const COLLECTIONS = [
  "tasks",
  "projects",
  "plans",
  "notes",
  "sites",
  "experiments",
];
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const directions = new Set(["", ...DIRECTIONS.map((x) => x.id)]);

export function createWorkspace(examples = true) {
  const state = {
    tasks: [],
    projects: [],
    plans: [],
    notes: [],
    experiments: [],
    sites: [
      { id: "site-chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
      { id: "site-claude", name: "Claude", url: "https://claude.ai/" },
      { id: "site-ima", name: "ima", url: "https://ima.qq.com/" },
      { id: "site-github", name: "GitHub", url: "https://github.com/" },
      { id: "site-arxiv", name: "arXiv", url: "https://arxiv.org/" },
    ],
  };
  if (!examples) return state;
  const now = new Date().toISOString();
  state.tasks = [
    ["读完一篇前沿文章", "ai"],
    ["整理治理实践笔记", "govern"],
    ["完成一次运动", "life"],
    ["记录一个工具想法", "learn"],
  ].map(([title, direction], index) => ({
    id: `example-task-${index}`,
    title,
    direction,
    done: false,
    demo: true,
  }));
  state.projects = [
    {
      id: "example-project-invest",
      title: "建立期权研究框架",
      direction: "invest",
      demo: true,
      steps: ["概念梳理", "模拟验证", "复盘方法"].map((title, i) => ({
        id: `invest-step-${i}`,
        title,
        done: false,
      })),
    },
    {
      id: "example-project-learn",
      title: "用 AI 掌握一门新技术",
      direction: "learn",
      demo: true,
      steps: ["定义目标", "动手实现", "独立检验"].map((title, i) => ({
        id: `learn-step-${i}`,
        title,
        done: false,
      })),
    },
  ];
  state.plans = [
    ["梳理一个投资研究问题", "invest", "next"],
    ["安排一次家庭拍摄", "life", "next"],
    ["尝试 AI 辅助阅读", "ai", "active"],
    ["搭一个文本处理小工具", "learn", "active"],
    ["记录本周学习收获", "learn", "done"],
    ["整理开源治理实践笔记", "govern", "done"],
  ].map(([title, direction, status], index) => ({
    id: `example-plan-${index}`,
    title,
    direction,
    status,
    demo: true,
  }));
  state.notes = [
    {
      id: "example-note-1",
      body: "能不能把 AI 会话里的建议变成可验证的学习步骤？",
      direction: "learn",
      createdAt: now,
      demo: true,
    },
    {
      id: "example-note-2",
      body: "让拍摄成为记录家庭生活的习惯。",
      direction: "life",
      createdAt: now,
      demo: true,
    },
  ];
  return state;
}

export function safeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function string(value, name, max = 300) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`${name}为空或超过长度限制`);
  return value;
}
function boolean(value, name) {
  if (typeof value !== "boolean") throw new Error(`${name}必须为布尔值`);
  return value;
}
function unique(items, name) {
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`${name}包含重复标识`);
    ids.add(item.id);
  }
}

// Reconstruct known fields, rather than accepting arbitrary imported object properties.
export function validateWorkspace(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("工作区格式不正确");
  const output = {};
  for (const key of COLLECTIONS) {
    if (!Array.isArray(input[key]) || input[key].length > 1000)
      throw new Error(`${key}格式或数量不正确`);
    output[key] = input[key].map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new Error("记录格式不正确");
      const result = { id: string(item.id, "记录标识", 100) };
      if (key === "sites") {
        result.name = string(item.name, "网站名称", 80);
        result.url = safeUrl(item.url);
        if (!result.url || result.url.length > 2000)
          throw new Error("网站需要有效的 HTTP(S) 地址");
        return result;
      }
      if (!directions.has(item.direction)) throw new Error("未知的长期方向");
      result.direction = item.direction;
      if (item.demo !== undefined) result.demo = boolean(item.demo, "示例标识");
      if (item.createdAt !== undefined) {
        if (
          typeof item.createdAt !== "string" ||
          !Number.isFinite(Date.parse(item.createdAt))
        )
          throw new Error("记录日期不正确");
        result.createdAt = item.createdAt;
      }
      if (item.dueDate) {
        if (
          typeof item.dueDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ||
          !Number.isFinite(Date.parse(item.dueDate))
        )
          throw new Error("目标日期不正确");
        result.dueDate = item.dueDate;
      }
      if (key === "notes") result.body = string(item.body, "笔记内容", 10000);
      else result.title = string(item.title, "名称");
      if (key === "tasks") result.done = boolean(item.done, "待办状态");
      if (key === "plans") {
        if (!["next", "active", "done"].includes(item.status))
          throw new Error("计划状态不正确");
        result.status = item.status;
      }
      if (key === "projects") {
        if (!Array.isArray(item.steps) || item.steps.length > 100)
          throw new Error("学习步骤格式或数量不正确");
        result.steps = item.steps.map((step) => ({
          id: string(step.id, "步骤标识", 100),
          title: string(step.title, "步骤内容"),
          done: boolean(step.done, "步骤状态"),
        }));
        unique(result.steps, "学习步骤");
      }
      if (key === "experiments") {
        result.description =
          typeof item.description === "string"
            ? item.description.slice(0, 10000)
            : "";
        if (!["idea", "building", "ready"].includes(item.status))
          throw new Error("实验状态不正确");
        result.status = item.status;
        result.url = item.url ? safeUrl(item.url) : "";
        if (item.url && (!result.url || result.url.length > 2000))
          throw new Error("实验链接需要有效的 HTTP(S) 地址");
      }
      return result;
    });
    unique(output[key], key);
  }
  return output;
}

export function serializeBackup(state) {
  const text = JSON.stringify(
    {
      format: "personal-cockpit",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: validateWorkspace(state),
    },
    null,
    2,
  );
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error("工作区已达到 2 MB 上限，请先备份并整理部分内容");
  return text;
}

export function parseBackup(text) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > MAX_BACKUP_BYTES
  )
    throw new Error("备份文件不能超过 2 MB");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("备份不是有效的 JSON 文件");
  }
  if (value?.format !== "personal-cockpit" || value.version !== 1)
    throw new Error("这不是受支持的个人驾驶舱备份");
  return validateWorkspace(value.data);
}

export function loadWorkspace(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createWorkspace(), status: "unavailable" };
  }
  if (raw === null) return { state: createWorkspace(), status: "new" };
  try {
    return { state: parseBackup(raw), status: "saved", raw };
  } catch {
    return { state: createWorkspace(false), status: "corrupt", raw };
  }
}

export function saveWorkspace(storage, state) {
  const raw = serializeBackup(state);
  storage.setItem(STORAGE_KEY, raw);
  return raw;
}

export function removeExamples(state) {
  const copy = structuredClone(state);
  for (const key of COLLECTIONS)
    if (key !== "sites") copy[key] = copy[key].filter((item) => !item.demo);
  return copy;
}

export function textStatistics(text) {
  return {
    characters: Array.from(text).length,
    nonWhitespace: Array.from(text.replace(/\s/g, "")).length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
  };
}

export function formatJson(text) {
  return JSON.stringify(JSON.parse(text), null, 2);
}

export class FocusClock {
  constructor(seconds = 1500) {
    this.reset(seconds);
  }
  reset(seconds = this.duration) {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10800)
      throw new Error("专注时长需要在 1 秒至 180 分钟之间");
    this.duration = seconds;
    this.remaining = seconds * 1000;
    this.deadline = null;
  }
  start(now = Date.now()) {
    if (this.deadline !== null) return;
    if (this.remaining <= 0) this.remaining = this.duration * 1000;
    this.deadline = now + this.remaining;
  }
  pause(now = Date.now()) {
    if (this.deadline !== null)
      this.remaining = Math.max(0, this.deadline - now);
    this.deadline = null;
  }
  read(now = Date.now()) {
    if (this.deadline !== null) {
      this.remaining = Math.max(0, this.deadline - now);
      if (!this.remaining) this.deadline = null;
    }
    return {
      remainingSeconds: Math.ceil(this.remaining / 1000),
      running: this.deadline !== null,
    };
  }
}
