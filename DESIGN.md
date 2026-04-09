# Homework 1.1 设计文档

## 一、领域对象如何被消费

### 1. View 层直接消费的是什么？

View 层直接消费的是 `gameDomain` store（来自 `src/node_modules/@sudoku/stores/gameDomain.js`）。

```
View 层
   │
   ├── $gameDomain.canUndo  →  控制 Undo 按钮状态
   ├── $gameDomain.canRedo  →  控制 Redo 按钮状态
   └── $userGrid            →  渲染棋盘数据
```

**不是直接消费 `Sudoku` 或 `Game` 对象**——它们被封装在 store 内部。

---

### 2. View 层拿到的数据是什么？

| 数据 | 类型 | 用途 |
|------|------|------|
| `$gameDomain.canUndo` | boolean | Undo 按钮是否可用 |
| `$gameDomain.canRedo` | boolean | Redo 按钮是否可用 |
| `$userGrid` | number[][] | 棋盘数据，用于渲染 |

---

### 3. 用户操作如何进入领域对象？

```
用户点击数字按钮
       │
       ▼
Keyboard.svelte
  handleKeyButton(num)
       │
       ├── userGrid.set($cursor, num)  →  更新 UI 显示
       │
       └── gameDomain.guess($cursor, num)  →  调用领域对象
                │
                ▼
           Game.guess({ row: y, col: x, value })
                │
                ├── 保存快照到 HistoryManager
                └── 修改 Sudoku 棋盘数据
                         │
                         ▼
                   updateState()
                         │
                         ├── 更新 canUndo/canRedo
                         └── 同步到 userGrid store
                                  │
                                  ▼
                            Svelte 检测到 store 变化
                                  │
                                  ▼
                            触发 UI 重新渲染
```

---

### 4. 领域对象变化后，Svelte 为什么会更新？

**核心机制：Svelte Store 的响应式订阅**

```javascript
// gameDomain.js
const state = writable({
  game: null,
  canUndo: false,
  canRedo: false
});

// 当调用 updateState() 时：
function updateState() {
  if (gameInstance) {
    state.set({              // ← 使用 .set() 创建新对象
      game: gameInstance,
      canUndo: gameInstance.canUndo(),
      canRedo: gameInstance.canRedo()
    });
    syncToUserGrid();         // ← userGrid.set() 也会触发更新
  }
}
```

**为什么 `.set()` 会触发更新？**

Svelte 的 `writable` store 内部维护了一个订阅者列表。当调用 `.set()` 时：
1. Svelte 比较新旧值（使用 `!==`）
2. 检测到值变化后通知所有订阅者
3. 组件中 `$store` 绑定的数据随之更新
4. Svelte 自动重新渲染使用了这些数据的组件

---

## 二、响应式机制说明

### 1. 我们依赖的是什么机制？

我们依赖的是 **Svelte writable store** 的响应式机制：

```javascript
// gameDomain.js
import { writable } from 'svelte/store';

function createGameStore() {
  const state = writable({
    canUndo: false,
    canRedo: false
  });

  return {
    subscribe: state.subscribe,
    // ...
  };
}
```

### 2. 哪些数据是响应式暴露给 UI 的？

| Store | 响应式数据 | 用途 |
|-------|-----------|------|
| `gameDomain` | `canUndo`, `canRedo` | UI 按钮状态 |
| `userGrid` | 整个 9x9 数组 | 棋盘渲染 |

### 3. 哪些状态留在领域对象内部？

| 内部状态 | 原因 |
|---------|------|
| `HistoryManager.history` | UI 不需要知道历史细节，只需要能调用 undo/redo |
| `HistoryManager.redoHistory` | 同上 |
| `Sudoku.grid` | 通过 `userGrid` store 间接暴露给 UI |

### 4. 如果不用 store，直接 mutate 内部对象，会出现什么问题？

**问题示例：**

```javascript
// 错误做法：直接修改内部数组
currentSudoku.getGrid()[row][col] = value;
```

**为什么 Svelte 不会自动更新？**

1. Svelte 的响应式系统基于 **赋值操作**（`=`）触发，而不是基于 **属性修改**（`.prop = value`）

2. 当你执行 `array[row][col] = value` 时：
   - 数组引用没变
   - Svelte 没有检测到新的赋值操作
   - `$userGrid` 不会触发重新渲染

---

## 三、模块化架构

### 文件结构

```
src/domain/
├── index.js          # 统一导出入口
├── sudoku.js         # 棋盘领域对象
├── game.js           # 游戏领域对象
├── history.js        # 历史管理
├── validation.js     # 输入验证
├── structure.js      # 数独结构验证
└── serialization.js  # 序列化/反序列化
```

### 各模块职责

| 模块 | 职责 | 导出 |
|------|------|------|
| `sudoku.js` | 棋盘数据、guess、clone、toJSON | `createSudoku`, `deepClone` |
| `game.js` | 游戏流程、guess/undo/redo 协调 | `createGame` |
| `history.js` | Undo/Redo 历史栈管理 | `createHistoryManager` |
| `validation.js` | 输入参数校验 | `validateGrid`, `validateMove` |
| `structure.js` | 数独规则结构验证 | `isValidSudokuStructure` |
| `serialization.js` | JSON 序列化/反序列化 | `createSudokuFromJSON`, `createGameFromJSON` |

### 模块依赖关系

```
validation.js
      │
      ▼
sudoku.js ─────────────────────────┐
      │                            │
      ▼                            ▼
game.js ◄──── history.js    serialization.js
      │         │
      │         │
      ▼         ▼
   index.js
```

---

## 四、改进说明

### 1. 相比 Homework 1，改进了什么？

| HW1 问题 | 改进方案 |
|---------|---------|
| 领域对象只存在于测试中 | 创建 `gameDomain` store 真正接入 Svelte |
| UI 直接操作旧 store | UI 通过 `gameDomain.guess()` 调用领域对象 |
| Undo/Redo 按钮逻辑不连领域对象 | 按钮直接调用 `gameDomain.undo()/redo()` |
| `getGrid()` 直接暴露内部引用 | 返回 `deepClone(grid)` 副本 |
| `getSudoku()` 暴露内部 Sudoku 实例 | 返回 `currentSudoku.clone()` 副本 |
| 没有输入验证 | 添加 `validateGrid()` 和 `validateMove()` |
| 反序列化无校验 | 添加 JSON 结构校验 |
| history 数组生命周期不清 | 使用 `deepClone()` 复制传入的 history |
| 所有代码堆在一个文件 | 拆分为多个职责明确的模块 |

### 2. 新设计的 trade-off

| 优点 | 缺点 |
|------|------|
| 领域逻辑与 UI 分离，易于测试 | 多了一层 store，需要维护 |
| Undo/Redo 逻辑集中在领域层 | 同步 userGrid 有一定性能开销（但可接受） |
| 扩展性好，可以轻松替换底层实现 | - |
| 封装性更好，内部状态不可直接修改 | - |
| 输入校验更健壮 | - |
| 模块边界清晰，便于维护和扩展 | - |

---

## 五、技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        View 层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Board.svelte │  │Actions.svelte│  │Keyboard.svelte│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Store 适配层                              │
│         src/node_modules/@sudoku/stores/                   │
│                      gameDomain.js                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  gameDomain Store                                    │   │
│  │  ├── canUndo, canRedo (响应式)                      │   │
│  │  ├── startNew(), startCustom()                     │   │
│  │  ├── guess(), undo(), redo()                       │   │
│  │  └── toJSON(), loadFromJSON()                      │   │
│  │                                                      │   │
│  │  userGrid Store                                     │   │
│  │  └── 9x9 数组 (响应式，用于 UI 渲染)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      领域层                                 │
│                   src/domain/                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  sudoku.js  │  │  game.js    │  │ history.js  │        │
│  │  棋盘数据    │  │  游戏流程    │  │  历史管理    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │validation.js│  │structure.js│  │serializat.js│        │
│  │  输入校验    │  │  规则验证    │  │  序列化      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、安全性设计

### 1. 输入验证

```javascript
// validation.js
function validateGrid(grid) {
  // 检查是否是 9x9 数组
  // 检查每个值是否在 0-9 范围内
}

function validateMove(move) {
  // 检查 move 对象结构
  // 检查坐标是否在 0-8 范围内
  // 检查值是否在 0-9 范围内
}
```

### 2. 反序列化校验

```javascript
// serialization.js
function createSudokuFromJSON(json) {
  if (!json || typeof json !== 'object' || !Array.isArray(json.grid)) {
    throw new Error('Invalid JSON: missing or invalid grid property');
  }
  return createSudoku(json.grid);
}
```

### 3. 内部状态保护

```javascript
// sudoku.js
getGrid() {
  return deepClone(grid);  // 返回副本，防止外部修改
}

// game.js
getSudoku() {
  return currentSudoku.clone();  // 返回副本，防止外部绕过 history 管理
}
```

---

## 七、文件清单

| 文件路径 | 职责 |
|---------|------|
| `src/domain/sudoku.js` | 核心领域对象 - 棋盘 |
| `src/domain/game.js` | 核心领域对象 - 游戏 |
| `src/domain/history.js` | 历史管理 |
| `src/domain/validation.js` | 输入验证 |
| `src/domain/structure.js` | 数独结构验证 |
| `src/domain/serialization.js` | 序列化/反序列化 |
| `src/domain/index.js` | 统一导出入口 |
| `src/node_modules/@sudoku/stores/gameDomain.js` | Store 适配层 |
| `src/node_modules/@sudoku/game.js` | 游戏入口（startNew, startCustom） |
| `src/components/Controls/ActionBar/Actions.svelte` | Undo/Redo 按钮 |
| `src/components/Controls/Keyboard.svelte` | 数字键盘输入 |
| `src/components/Board/index.svelte` | 棋盘渲染 |
