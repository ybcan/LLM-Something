import {
  DIRECTIONS,
  STORAGE_KEY,
  createWorkspace,
  validateWorkspace,
  loadWorkspace,
  saveWorkspace,
  serializeBackup,
  parseBackup,
  removeExamples,
  safeUrl,
  textStatistics,
  formatJson,
  FocusClock,
} from "./workspace.mjs";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const PATHS = {
  cube: ["M12 2 22 7v10l-10 5L2 17V7Z", "M2 7l10 5 10-5M12 12v10M12 2v10"],
  home: ["m3 10 9-7 9 7v11h-6v-7H9v7H3Z"],
  layers: ["m12 3 10 5-10 5L2 8Z", "m2 12 10 5 10-5M2 16l10 5 10-5"],
  check: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "m7 12 3 3 7-7",
  ],
  note: [
    "M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7",
    "m16 3 5 5-9 9-6 1 1-6Z",
  ],
  flask: ["M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 15h10"],
  chart: ["M3 3v18h18M6 15l5-6 4 3 6-8M17 4h4v4"],
  spark: ["m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"],
  code: ["m7 5-6 7 6 7M17 5l6 7-6 7M14 3l-4 18"],
  learn: ["m2 8 10-5 10 5-10 5Z", "M6 10v8q6 5 12 0v-8M22 8v9"],
  people: [
    "M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM17 4a3 3 0 0 1 0 6M2 21v-4a6 6 0 0 1 12 0v4M18 13a5 5 0 0 1 4 5v3",
  ],
  document: ["M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8"],
  plus: ["M12 4v16M4 12h16"],
  close: ["m6 6 12 12M6 18 18 6"],
  "arrow-right": ["M4 12h16m-6-6 6 6-6 6"],
  calendar: ["M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 17h2"],
  link: [
    "m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  ],
  clock: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v7l5 2"],
  braces: [
    "M8 3H6a2 2 0 0 0-2 2v4l-2 3 2 3v4a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v4l2 3-2 3v4a2 2 0 0 1-2 2h-2",
  ],
  play: ["m8 4 12 8-12 8Z"],
  pause: ["M8 4v16M16 4v16"],
  stop: ["M6 6h12v12H6Z"],
  sliders: ["M4 6h16M4 18h16M8 3v6M16 15v6"],
  settings: [
    "m9 2-1 4-4 1-2 4 3 3v4l4 2 3-2 4 2 4-2v-4l3-3-2-4-4-1-1-4Z",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  ],
  download: ["M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"],
  upload: ["M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"],
  lock: ["M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4M12 14v3"],
  search: ["M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM16 16l6 6"],
  return: ["M20 5v9H4m5-5-5 5 5 5"],
  filter: ["M3 4h18l-7 8v7l-4 2v-9Z"],
  edit: ["m16 3 5 5-11 11-6 1 1-6ZM14 5l5 5"],
  github: [
    "M9 19c-5 2-5-3-7-3M16 22v-4a4 4 0 0 0-1-3c4 0 6-2 6-6a5 5 0 0 0-2-4c1-2 0-4 0-4-2 0-4 2-4 2a13 13 0 0 0-6 0S7 1 5 1c0 0-1 2 0 4a5 5 0 0 0-2 4c0 4 2 6 6 6a4 4 0 0 0-1 3v4",
  ],
  swirl: [
    "M12 3a5 5 0 0 1 8 5 5 5 0 0 1 0 9 5 5 0 0 1-8 4 5 5 0 0 1-8-5 5 5 0 0 1 0-9 5 5 0 0 1 8-4Z",
    "m12 6 6 4v7l-6 3-6-4V9ZM6 9l6 4 6-3M12 13v7",
  ],
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function icon(name) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  for (const d of PATHS[name] || PATHS.document) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}
document
  .querySelectorAll("[data-icon]")
  .forEach((node) => node.replaceWith(icon(node.dataset.icon)));

const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const initial = loadWorkspace(storage);
let state = initial.state;
let storageStatus = initial.status;
let corruptRaw = initial.status === "corrupt" ? initial.raw : null;
let savedSnapshot = initial.raw ?? null;
let volatileChanges = false;
let direction = "",
  query = "",
  view = "overview",
  editing = null,
  notesExpanded = false;
let toastTimeout;
const clock = new FocusClock();
const names = {
  tasks: "待办",
  projects: "学习",
  plans: "计划",
  notes: "笔记",
  sites: "网站",
  experiments: "实验",
};
const viewInfo = {
  overview: [
    "总览",
    "把今天，连到长远。",
    "学习、行动、想法与实验，在一个工作空间里继续。",
  ],
  learning: [
    "学习与计划",
    "让每一步，都有积累。",
    "把想掌握的东西拆成步骤，让计划慢慢变成现实。",
  ],
  tasks: [
    "待办事项",
    "从一件重要的事开始。",
    "少一点悬而未决，多一点实际行动。",
  ],
  notes: [
    "随手记",
    "先留住，再慢慢想。",
    "一闪而过的灵感、问题和收获，都值得有个位置。",
  ],
  lab: [
    "实验空间",
    "把想法，做成小东西。",
    "从一个小问题开始，做自己真正用得上的工具。",
  ],
};

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    $("toast").hidden = true;
  }, 3300);
}
function tag(id) {
  const d = DIRECTIONS.find((x) => x.id === id);
  const node = el("span", "tag");
  if (d) {
    const dot = el("span", "dot");
    dot.style.setProperty("--direction", d.color);
    node.append(dot, document.createTextNode(d.name));
  } else node.textContent = "未归类";
  return node;
}
function matches(item) {
  if (direction && item.direction !== direction) return false;
  return (
    !query ||
    [
      item.title,
      item.name,
      item.body,
      item.description,
      ...(item.steps || []).map((x) => x.title),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query)
  );
}
function dateLabel(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function dueLabel(value) {
  return value ? `目标 ${value.replaceAll("-", ".")}` : "";
}
function editButton(kind, item) {
  const title = item.title || item.name || item.body.slice(0, 18);
  const button = el("button", "icon-button edit-record");
  button.setAttribute("aria-label", `编辑${names[kind]}：${title}`);
  button.title = "编辑";
  button.append(icon("edit"));
  button.addEventListener("click", () => openRecord(kind, item.id));
  return button;
}
function empty(parent, message, kind) {
  const box = el("div", "empty-state");
  box.append(
    icon(kind === "experiments" ? "flask" : "spark"),
    el("p", null, message),
  );
  if (kind) {
    const button = el("button", "button small", "＋ 添加" + names[kind]);
    button.addEventListener("click", () => openRecord(kind));
    box.append(button);
  }
  parent.append(box);
}

// A bad stored snapshot is never implicitly replaced. Volatile changes remain
// visible and exportable if the browser refuses a write.
function commit(change) {
  if (corruptRaw !== null) {
    toast("请先在数据设置中恢复备份或重建工作区，原始记录未被覆盖。");
    return false;
  }
  let next;
  let base = state;
  let baseline = savedSnapshot;
  let latestRaw;
  try {
    latestRaw = storage.getItem(STORAGE_KEY);
  } catch {
    latestRaw = savedSnapshot;
  }
  if (latestRaw !== savedSnapshot) {
    if (volatileChanges) {
      toast(
        "其他标签页更新了工作区。本页还有未保存内容，请先导出备份，再刷新后继续。",
      );
      return false;
    }
    try {
      base =
        latestRaw === null ? createWorkspace(false) : parseBackup(latestRaw);
      baseline = latestRaw;
    } catch {
      corruptRaw = latestRaw;
      updateStorageStatus();
      toast("其他标签页的记录无法读取，已暂停写入，避免覆盖原始数据。");
      return false;
    }
  }
  try {
    next = structuredClone(base);
    change(next);
    next = validateWorkspace(next);
    serializeBackup(next);
  } catch (error) {
    toast(error.message);
    return false;
  }
  try {
    savedSnapshot = saveWorkspace(storage, next);
    volatileChanges = false;
    storageStatus = "saved";
  } catch {
    savedSnapshot = baseline;
    volatileChanges = true;
    storageStatus = "unavailable";
  }
  state = next;
  render();
  if (storageStatus === "unavailable")
    toast("仅暂存在本页。浏览器未能保存，请在刷新前导出备份。");
  return true;
}

function renderProjects() {
  const root = $("projects-list");
  root.replaceChildren();
  const projects = state.projects.filter(matches);
  $("project-summary").textContent = `${projects.length} 个学习项目`;
  if (!projects.length)
    empty(
      root,
      query || direction
        ? "这个筛选下，还没有学习项目。"
        : "把想学的技术或方法，拆成可以完成的步骤。",
      "projects",
    );
  for (const project of projects) {
    const card = el("article", "project");
    const symbol = el("div", "project-icon");
    symbol.append(
      icon(DIRECTIONS.find((d) => d.id === project.direction)?.icon || "learn"),
    );
    const content = el("div", "project-content"),
      title = el("div", "project-title-row");
    title.append(el("h3", null, project.title), tag(project.direction));
    const completed = project.steps.filter((x) => x.done).length;
    const next = project.steps.find((x) => !x.done);
    const subtitle = el(
      "p",
      "project-next",
      project.steps.length
        ? next
          ? "下一步：" + next.title
          : "这一组步骤已完成，记下收获吧。"
        : "还没有学习步骤，点击编辑来拆解。",
    );
    const count = el(
      "span",
      "project-count",
      `${completed} / ${project.steps.length} 步`,
    );
    content.append(title, subtitle, count);
    if (project.demo) content.append(el("span", "example-label", " · 示例"));
    const steps = el("div", "project-steps");
    project.steps.forEach((step, index) => {
      if (index) steps.append(el("span", "step-arrow", "›"));
      const label = el("label", "step-pill" + (step.done ? " done" : ""));
      const input = el("input");
      input.type = "checkbox";
      input.checked = step.done;
      input.dataset.focusKey = step.id;
      input.addEventListener("change", () =>
        commit((s) => {
          const p = s.projects.find((x) => x.id === project.id);
          p.steps.find((x) => x.id === step.id).done = input.checked;
          p.demo = false;
        }),
      );
      label.append(input, el("span", null, step.title));
      steps.append(label);
    });
    card.append(symbol, content, steps, editButton("projects", project));
    root.append(card);
  }
}

function renderPlans() {
  const root = $("plan-columns");
  root.replaceChildren();
  const statuses = [
    ["next", "准备开始", "#b99be9"],
    ["active", "正在推进", "#7ce8ee"],
    ["done", "回顾与沉淀", "#c0a1ed"],
  ];
  for (const [status, name, color] of statuses) {
    const section = el("section", "plan-column");
    section.dataset.status = status;
    section.style.setProperty("--column", color);
    const plans = state.plans.filter((p) => p.status === status && matches(p));
    const heading = el("div", "column-heading", name);
    heading.append(el("span", "count", String(plans.length)));
    const cards = el("div", "plan-cards");
    if (!plans.length) empty(cards, "留一点空间给下一步。");
    for (const plan of plans) {
      const card = el("article", "plan-card");
      const title = el("button", "plan-title", plan.title);
      title.addEventListener("click", () => openRecord("plans", plan.id));
      const footer = el("div", "plan-footer"),
        advance = el("button", "advance-plan");
      advance.setAttribute("aria-label", `推进计划：${plan.title}`);
      advance.title =
        status === "done"
          ? "重新准备"
          : status === "next"
            ? "开始推进"
            : "完成并沉淀";
      advance.append(icon(status === "done" ? "return" : "arrow-right"));
      advance.addEventListener("click", () =>
        commit((s) => {
          const item = s.plans.find((x) => x.id === plan.id);
          item.status = { next: "active", active: "done", done: "next" }[
            status
          ];
          item.demo = false;
        }),
      );
      footer.append(tag(plan.direction), advance);
      if (plan.demo)
        footer.insertBefore(el("span", "example-label", "示例"), advance);
      card.append(title, editButton("plans", plan), footer);
      if (plan.dueDate)
        card.append(el("p", "plan-meta", dueLabel(plan.dueDate)));
      cards.append(card);
    }
    section.append(heading, cards);
    root.append(section);
  }
}

function renderTasks() {
  const root = $("tasks-list");
  root.replaceChildren();
  const tasks = state.tasks.filter(matches);
  $("task-count").textContent = String(tasks.filter((x) => !x.done).length);
  const filter = $("task-filter").value;
  const visible = tasks.filter(
    (t) => filter === "all" || (filter === "done" ? t.done : !t.done),
  );
  if (!visible.length) {
    empty(
      root,
      filter === "done"
        ? "完成的事情会留在这里。"
        : "暂时没有待办，从一件小事开始。",
    );
    root.firstChild.classList.add("task-empty");
  }
  for (const task of visible) {
    const row = el("div", "task-row" + (task.done ? " done" : ""));
    const check = el("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.id = "task-" + task.id;
    check.setAttribute("aria-label", `完成待办：${task.title}`);
    check.dataset.focusKey = task.id;
    check.addEventListener("change", () =>
      commit((s) => {
        const item = s.tasks.find((x) => x.id === task.id);
        item.done = check.checked;
        item.demo = false;
      }),
    );
    const content = el("div", "task-content"),
      title = el("label", "task-title", task.title);
    title.htmlFor = check.id;
    const meta = el("div", "task-meta");
    meta.append(tag(task.direction));
    if (task.demo) meta.append(el("span", "example-label", "示例"));
    if (task.dueDate) meta.append(el("span", null, dueLabel(task.dueDate)));
    content.append(title, meta);
    row.append(check, content, editButton("tasks", task));
    root.append(row);
  }
}

function renderNotes() {
  const root = $("notes-list");
  root.replaceChildren();
  const notes = state.notes.filter(matches);
  $("note-count").textContent = `${notes.length} 条`;
  if (!notes.length)
    empty(
      root,
      query || direction
        ? "这个筛选下，还没有随手记。"
        : "不必想清楚再记录，一句话也可以。",
    );
  const limit = view === "notes" || notesExpanded || query ? notes.length : 3;
  for (const note of notes.slice(0, limit)) {
    const item = el("article", "note-item"),
      symbol = el("div", "note-symbol");
    symbol.append(icon("document"));
    const body = el("div", "note-body"),
      meta = el("div", "note-meta");
    meta.append(
      tag(note.direction),
      el(
        "time",
        note.demo ? "example-label" : null,
        note.demo ? "示例" : dateLabel(note.createdAt),
      ),
    );
    body.append(el("p", null, note.body), meta);
    item.append(symbol, body, editButton("notes", note));
    root.append(item);
  }
  if (notes.length > limit) {
    const more = el(
      "button",
      "subtle-link more-notes",
      `查看其余 ${notes.length - limit} 条记录 →`,
    );
    more.addEventListener("click", () => {
      notesExpanded = true;
      renderNotes();
    });
    root.append(more);
  }
}

function renderSites() {
  const root = $("sites-list");
  root.replaceChildren();
  const sites = state.sites.filter(
    (s) => !query || s.name.toLocaleLowerCase().includes(query),
  );
  for (const site of sites) {
    const wrap = el("div", "site-tile-wrap"),
      link = el("a", "dock-tile");
    link.href = safeUrl(site.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = site.url;
    const known = {
      ChatGPT: "swirl",
      Claude: "spark",
      ima: "spark",
      GitHub: "github",
      arXiv: "code",
    }[site.name];
    if (known) link.append(icon(known));
    else {
      const letter = el("span", "site-letter", Array.from(site.name)[0]);
      letter.setAttribute("aria-hidden", "true");
      link.append(letter);
    }
    if (site.name === "Claude") link.classList.add("site-claude");
    if (site.name === "ima") link.classList.add("site-ima");
    link.append(el("span", null, site.name));
    wrap.append(link, editButton("sites", site));
    root.append(wrap);
  }
  if (!sites.length)
    empty(root, query ? "没有匹配的网站。" : "添加你的常用网站。");
}

function renderExperiments() {
  const root = $("experiment-list");
  root.replaceChildren();
  const experiments = state.experiments.filter(matches);
  if (!experiments.length)
    empty(root, "下一个实验，可以从一个很小的问题开始。", "experiments");
  for (const experiment of experiments) {
    const card = el("article", "experiment-card"),
      top = el("div", "experiment-top");
    top.append(
      el("h3", null, experiment.title),
      editButton("experiments", experiment),
    );
    const footer = el("div", "experiment-footer");
    footer.append(
      tag(experiment.direction),
      el(
        "span",
        "experiment-status",
        { idea: "构想中", building: "开发中", ready: "已完成" }[
          experiment.status
        ],
      ),
    );
    if (experiment.url) {
      const a = el("a", null, "打开工具 ↗");
      a.href = safeUrl(experiment.url);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      footer.append(a);
    }
    card.append(
      top,
      el("p", null, experiment.description || "还没有补充描述。"),
      footer,
    );
    root.append(card);
  }
  $("lab-library").hidden = view !== "lab" && !(query && experiments.length);
}

function updateStorageStatus() {
  const collections = ["tasks", "projects", "plans", "notes", "experiments"];
  const count = collections.reduce((n, key) => n + state[key].length, 0);
  const examples = collections.some((key) => state[key].some((x) => x.demo));
  $("example-status").textContent = examples
    ? "含示例 · 可在设置中清除"
    : "我的本地工作区";
  const warning = storageStatus === "unavailable" || corruptRaw !== null;
  $("status-light").classList.toggle("warning", warning);
  $("save-status").textContent =
    corruptRaw !== null
      ? "原始记录未覆盖，等待恢复"
      : storageStatus === "unavailable"
        ? "仅暂存本页，请及时导出"
        : storageStatus === "new"
          ? "示例内容，尚未保存个人记录"
          : `已在本地保存 ${count} 条记录`;
  $("storage-alert").hidden = !warning;
  $("storage-message").textContent =
    corruptRaw !== null
      ? "本地记录读取失败。原始数据未被覆盖，请到数据设置中恢复备份或下载原始数据。"
      : "浏览器未能保存数据。当前更改仅在本页可用，请在刷新或关闭前导出备份。";
  $("recovery-row").hidden = corruptRaw === null;
}

function render() {
  const focused = document.activeElement?.dataset?.focusKey;
  renderProjects();
  renderPlans();
  renderTasks();
  renderNotes();
  renderSites();
  renderExperiments();
  updateStorageStatus();
  document.querySelectorAll("[data-direction]").forEach((b) => {
    b.classList.toggle("active", b.dataset.direction === direction);
    b.setAttribute("aria-pressed", String(b.dataset.direction === direction));
  });
  $("filter-bar").hidden = !direction && !query;
  $("filter-label").textContent = [
    DIRECTIONS.find((d) => d.id === direction)?.name,
    query ? `搜索：${$("global-search").value}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (focused)
    document
      .querySelector(`[data-focus-key="${CSS.escape(focused)}"]`)
      ?.focus({ preventScroll: true });
}

function setView(next) {
  view = next;
  const [name, title, subtitle] = viewInfo[next];
  $("view-name").textContent = name;
  $("page-title").textContent = title;
  $("page-subtitle").textContent = subtitle;
  document.querySelectorAll("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === next);
    if (b.dataset.view === next) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("overview-grid").hidden = next === "lab";
  $("overview-grid").classList.toggle("single-column", next !== "overview");
  $("learning-workspace").hidden = !["overview", "learning"].includes(next);
  $("right-column").hidden = !["overview", "tasks", "notes"].includes(next);
  $("tasks-panel").hidden = !["overview", "tasks"].includes(next);
  $("notes-panel").hidden = !["overview", "notes"].includes(next);
  render();
}

function fillDirections(select) {
  select.append(new Option("暂不关联", ""));
  DIRECTIONS.forEach((d) => select.append(new Option(d.name, d.id)));
}
fillDirections($("note-direction"));
fillDirections($("record-direction"));
for (const d of DIRECTIONS) {
  const side = el("button"),
    dot = el("span", "dot");
  dot.style.setProperty("--direction", d.color);
  side.append(dot, document.createTextNode(d.name));
  const strip = el("button");
  strip.style.setProperty("--direction", d.color);
  strip.append(icon(d.icon), document.createTextNode(d.name));
  for (const b of [side, strip]) {
    b.dataset.direction = d.id;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      direction = direction === d.id ? "" : d.id;
      $("note-direction").value = direction;
      render();
    });
  }
  $("direction-nav").append(side);
  $("direction-strip").append(strip);
}

function updateRecordFields() {
  const kind = $("record-kind").value;
  $("record-heading").textContent =
    (editing ? "编辑" : "新建") +
    {
      tasks: "待办事项",
      projects: "学习任务",
      plans: "计划",
      notes: "随手记",
      sites: "常用网站",
      experiments: "实验",
    }[kind];
  $("title-field").hidden = kind === "notes";
  $("record-title").required = kind !== "notes";
  $("record-title").maxLength = kind === "sites" ? 80 : 300;
  $("body-field").hidden = !["notes", "experiments"].includes(kind);
  $("record-body").required = kind === "notes";
  $("direction-field").hidden = kind === "sites";
  $("due-field").hidden = !["tasks", "plans"].includes(kind);
  $("steps-field").hidden = kind !== "projects";
  $("status-field").hidden = !["tasks", "plans", "experiments"].includes(kind);
  $("url-field").hidden = !["sites", "experiments"].includes(kind);
  $("record-url").required = kind === "sites";
  $("url-hint").textContent =
    kind === "experiments"
      ? "可不填，完成后再补上工具链接"
      : "使用 https:// 或 http:// 地址";
  $("record-status").replaceChildren();
  const options =
    kind === "plans"
      ? [
          ["next", "准备开始"],
          ["active", "正在推进"],
          ["done", "回顾与沉淀"],
        ]
      : kind === "tasks"
        ? [
            ["pending", "待完成"],
            ["done", "已完成"],
          ]
        : [
            ["idea", "构想中"],
            ["building", "开发中"],
            ["ready", "已完成"],
          ];
  options.forEach(([value, label]) =>
    $("record-status").append(new Option(label, value)),
  );
  $("record-error").hidden = true;
}

function openRecord(kind = "tasks", id = null) {
  const item = id ? state[kind].find((x) => x.id === id) : null;
  if (id && !item) return;
  editing = item ? { kind, id, original: recordSignature(item) } : null;
  $("record-form").reset();
  $("record-kind").value = kind;
  $("kind-field").hidden = !!editing;
  updateRecordFields();
  $("record-title").value = item?.title || item?.name || "";
  $("record-direction").value = item?.direction ?? direction;
  $("record-body").value = item?.body || item?.description || "";
  $("record-steps").value = item?.steps?.map((x) => x.title).join("\n") || "";
  $("record-due").value = item?.dueDate || "";
  $("record-url").value = item?.url || "";
  if (item)
    $("record-status").value =
      kind === "tasks" ? (item.done ? "done" : "pending") : item.status || "";
  $("record-delete").hidden = !editing;
  $("record-dialog").showModal();
  (kind === "notes" ? $("record-body") : $("record-title")).focus();
}

function preserveSteps(text, old = []) {
  const byTitle = new Map();
  for (const step of old) {
    if (!byTitle.has(step.title)) byTitle.set(step.title, []);
    byTitle.get(step.title).push(step);
  }
  return text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(
      (title) =>
        byTitle.get(title)?.shift() || { id: uid(), title, done: false },
    );
}

function recordSignature(item) {
  return JSON.stringify(item, [
    "id",
    "name",
    "title",
    "body",
    "direction",
    "demo",
    "createdAt",
    "dueDate",
    "done",
    "steps",
    "status",
    "description",
    "url",
  ]);
}

$("record-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const kind = editing?.kind || $("record-kind").value;
  const previous = editing
    ? state[kind].find((x) => x.id === editing.id)
    : null;
  const title = $("record-title").value.trim();
  const item = { id: previous?.id || uid() };
  try {
    if (kind === "sites") {
      item.name = title;
      item.url = safeUrl($("record-url").value);
      if (!item.url)
        throw new Error(
          "请输入有效的 HTTP(S) 网址，地址中不能包含用户名或密码。",
        );
    } else {
      item.direction = $("record-direction").value;
      item.createdAt = previous?.createdAt || new Date().toISOString();
      item.demo = false;
      if (kind === "notes") item.body = $("record-body").value.trim();
      else item.title = title;
      if (["tasks", "plans"].includes(kind) && $("record-due").value)
        item.dueDate = $("record-due").value;
      if (kind === "tasks") item.done = $("record-status").value === "done";
      if (kind === "projects")
        item.steps = preserveSteps($("record-steps").value, previous?.steps);
      if (kind === "plans") item.status = $("record-status").value;
      if (kind === "experiments") {
        item.description = $("record-body").value.trim();
        item.status = $("record-status").value;
        item.url = $("record-url").value.trim()
          ? safeUrl($("record-url").value)
          : "";
        if (item.url === null)
          throw new Error("实验链接需要有效的 HTTP(S) 地址。");
      }
    }
    const candidate = structuredClone(state);
    if (previous)
      candidate[kind] = candidate[kind].map((x) =>
        x.id === previous.id ? item : x,
      );
    else candidate[kind].unshift(item);
    validateWorkspace(candidate);
    if (
      !commit((s) => {
        if (editing) {
          const index = s[kind].findIndex((x) => x.id === editing.id);
          if (
            index < 0 ||
            recordSignature(s[kind][index]) !== editing.original
          ) {
            throw new Error(
              "这条记录已在其他标签页修改或删除。当前输入已保留，请复制后重新打开最新记录。",
            );
          }
          s[kind][index] = item;
        } else {
          s[kind].unshift(item);
        }
      })
    )
      return;
    if (direction && item.direction !== direction && kind !== "sites")
      direction = "";
    query = "";
    $("global-search").value = "";
    if (kind === "experiments") setView("lab");
    else if (view !== "overview")
      setView(
        {
          tasks: "tasks",
          projects: "learning",
          plans: "learning",
          notes: "notes",
          sites: view,
        }[kind],
      );
    render();
    $("record-dialog").close();
    if (storageStatus !== "unavailable")
      toast(previous ? "记录已更新" : "已放进你的工作区");
  } catch (error) {
    $("record-error").textContent = error.message;
    $("record-error").hidden = false;
  }
});

function confirmAction(title, description, accept = "确认") {
  $("confirm-heading").textContent = title;
  $("confirm-description").textContent = description;
  $("confirm-accept").textContent = accept;
  return new Promise((resolve) => {
    const dialog = $("confirm-dialog");
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "accept"),
      { once: true },
    );
    dialog.returnValue = "";
    dialog.showModal();
    $("confirm-cancel").focus();
  });
}
$("confirm-accept").addEventListener("click", () =>
  $("confirm-dialog").close("accept"),
);
$("confirm-cancel").addEventListener("click", () =>
  $("confirm-dialog").close("cancel"),
);
$("record-delete").addEventListener("click", async () => {
  if (!editing) return;
  const target = { ...editing };
  if (
    !(await confirmAction(
      "删除这条记录？",
      "删除后无法从页面撤销。重要内容建议先导出备份。",
      "删除",
    ))
  )
    return;
  if (
    commit((s) => {
      s[target.kind] = s[target.kind].filter((x) => x.id !== target.id);
    })
  ) {
    $("record-dialog").close();
    toast("记录已删除");
  }
});

function download(text, name, type = "application/json;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = el("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function exportWorkspace() {
  try {
    const date = new Date().toLocaleDateString("sv-SE");
    download(serializeBackup(state), `战略工作台-${date}.json`);
    toast("工作区备份已导出");
  } catch (error) {
    toast("导出失败：" + error.message);
  }
}
function openSettings() {
  $("settings-message").textContent = "";
  updateStorageStatus();
  $("settings-dialog").showModal();
}
function settingsMessage(text, error = false) {
  $("settings-message").textContent = text;
  $("settings-message").classList.toggle("error", error);
}
[
  "settings-button",
  "sidebar-settings",
  "alert-settings",
  "example-status",
].forEach((id) => $(id).addEventListener("click", openSettings));
["export-button", "footer-export"].forEach((id) =>
  $(id).addEventListener("click", exportWorkspace),
);
$("import-button").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", async () => {
  const file = $("import-file").files[0];
  $("import-file").value = "";
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("备份文件不能超过 2 MB");
    const imported = parseBackup(await file.text());
    if (
      !(await confirmAction(
        "替换当前工作区？",
        "备份已通过校验。导入会替换当前所有记录，包括常用网站。建议先导出当前工作区。",
        "确认恢复",
      ))
    )
      return;
    // Write first: if persistence fails, the current in-memory workspace is kept.
    savedSnapshot = saveWorkspace(storage, imported);
    volatileChanges = false;
    state = imported;
    corruptRaw = null;
    storageStatus = "saved";
    direction = "";
    query = "";
    $("global-search").value = "";
    render();
    settingsMessage("已从备份恢复工作区。");
  } catch (error) {
    settingsMessage(
      "无法恢复：" + error.message + "。当前记录没有被替换。",
      true,
    );
  }
});
$("clear-examples").addEventListener("click", async () => {
  if (
    !(await confirmAction(
      "清除示例内容？",
      "只删除仍标记为示例的内容。你新增或修改的记录，以及常用网站都会保留。",
      "清除示例",
    ))
  )
    return;
  if (commit((s) => Object.assign(s, removeExamples(s))))
    settingsMessage("示例已清除，你自己的记录已保留。");
});
$("export-raw").addEventListener("click", () => {
  if (corruptRaw !== null)
    download(
      corruptRaw,
      "战略工作台-待恢复原始记录.txt",
      "text/plain;charset=utf-8",
    );
});
$("reset-workspace").addEventListener("click", async () => {
  if (
    !(await confirmAction(
      "重新建立工作区？",
      "这会替换读取异常的原始数据。请先点击“下载原始数据”，保留恢复机会。",
      "确认重建",
    ))
  )
    return;
  try {
    const fresh = createWorkspace(false);
    savedSnapshot = saveWorkspace(storage, fresh);
    volatileChanges = false;
    state = fresh;
    corruptRaw = null;
    storageStatus = "saved";
    render();
    settingsMessage("已建立空白工作区。");
  } catch {
    settingsMessage("浏览器仍无法保存，原始数据未被替换。", true);
  }
});

function openTool(kind) {
  if (kind === "focus") {
    $("focus-minutes").value = clock.duration / 60;
    $("focus-dialog").showModal();
    return;
  }
  $("tool-heading").textContent =
    kind === "text" ? "文本处理 · 字符与行数" : "JSON 整理";
  const content = $("tool-content");
  content.replaceChildren();
  const input = el("textarea", "tool-input");
  input.id = "tool-input";
  input.setAttribute(
    "aria-label",
    kind === "text" ? "待统计文本" : "待整理 JSON",
  );
  input.placeholder =
    kind === "text" ? "在这里输入或粘贴文本…" : '{"hello": "world"}';
  input.spellcheck = false;
  const result = el("div", "tool-result");
  result.id = "tool-result";
  result.setAttribute("role", "status");
  content.append(input);
  if (kind === "text") {
    const update = () => {
      const stats = textStatistics(input.value);
      result.textContent = `${stats.characters} 个字符 · ${stats.nonWhitespace} 个非空白字符 · ${stats.lines} 行`;
    };
    input.addEventListener("input", update);
    update();
  } else {
    const format = el("button", "button primary", "格式化并检查");
    format.id = "json-format";
    format.addEventListener("click", () => {
      try {
        input.value = formatJson(input.value);
        result.classList.remove("error");
        result.textContent = "✓ JSON 语法有效，已格式化。";
      } catch (error) {
        result.classList.add("error");
        result.textContent = "JSON 无效：" + error.message;
      }
    });
    content.append(format);
    result.textContent = "输入 JSON 后点击检查；失败时会保留原始输入。";
  }
  content.append(result);
  $("tool-dialog").showModal();
  input.focus();
}

let wasRunning = false;
function updateClock() {
  const value = clock.read();
  const minutes = Math.floor(value.remainingSeconds / 60),
    seconds = value.remainingSeconds % 60;
  $("focus-time").textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  $("focus-toggle").replaceChildren(icon(value.running ? "pause" : "play"));
  $("focus-toggle").setAttribute(
    "aria-label",
    value.running ? "暂停专注" : "开始专注",
  );
  $("focus-toggle").title = value.running ? "暂停专注" : "开始专注";
  if (wasRunning && !value.running && value.remainingSeconds === 0)
    toast("这一段专注完成了，休息一下。");
  wasRunning = value.running;
}
$("focus-toggle").addEventListener("click", () => {
  if (clock.read().running) clock.pause();
  else clock.start();
  updateClock();
});
$("focus-reset").addEventListener("click", () => {
  clock.reset();
  updateClock();
});
$("focus-settings").addEventListener("click", () => openTool("focus"));
$("focus-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    clock.reset(Number($("focus-minutes").value) * 60);
    updateClock();
    $("focus-dialog").close();
  } catch (error) {
    toast(error.message);
  }
});
document.querySelectorAll("[data-minutes]").forEach((b) =>
  b.addEventListener("click", () => {
    $("focus-minutes").value = b.dataset.minutes;
  }),
);
setInterval(updateClock, 500);
document.addEventListener("visibilitychange", updateClock);
document
  .querySelectorAll("[data-tool]")
  .forEach((b) => b.addEventListener("click", () => openTool(b.dataset.tool)));
document
  .querySelectorAll("[data-new]")
  .forEach((b) => b.addEventListener("click", () => openRecord(b.dataset.new)));
document
  .querySelectorAll("[data-close]")
  .forEach((b) =>
    b.addEventListener("click", () => $(b.dataset.close).close()),
  );
document
  .querySelectorAll("[data-view]")
  .forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
$("open-lab").addEventListener("click", () => setView("lab"));
$("quick-add").addEventListener("click", () =>
  openRecord(
    { notes: "notes", learning: "projects", lab: "experiments" }[view] ||
      "tasks",
  ),
);
$("record-kind").addEventListener("change", updateRecordFields);
$("task-filter").addEventListener("change", renderTasks);
$("global-search").addEventListener("input", () => {
  query = $("global-search").value.trim().toLocaleLowerCase();
  render();
});
$("clear-filters").addEventListener("click", () => {
  query = "";
  direction = "";
  $("global-search").value = "";
  $("note-direction").value = "";
  render();
});
$("task-quick").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("task-text").value.trim();
  if (!title) {
    toast("先写下想做的一件事。");
    return;
  }
  if (
    commit((s) =>
      s.tasks.unshift({
        id: uid(),
        title,
        direction,
        done: false,
        demo: false,
        createdAt: new Date().toISOString(),
      }),
    )
  ) {
    $("task-text").value = "";
    $("task-filter").value = "pending";
    renderTasks();
  }
});
$("note-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const body = $("note-text").value.trim();
  if (!body) {
    toast("先写下一点内容。");
    return;
  }
  const noteDirection = $("note-direction").value;
  if (
    commit((s) =>
      s.notes.unshift({
        id: uid(),
        body,
        direction: noteDirection,
        createdAt: new Date().toISOString(),
        demo: false,
      }),
    )
  ) {
    $("note-text").value = "";
    if (direction && noteDirection !== direction) direction = "";
    query = "";
    $("global-search").value = "";
    render();
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement?.tagName,
    ) &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    $("global-search").focus();
  }
});
window.addEventListener("beforeunload", (event) => {
  if (storageStatus === "unavailable") {
    event.preventDefault();
    event.returnValue = "";
  }
});
updateClock();
setView("overview");
